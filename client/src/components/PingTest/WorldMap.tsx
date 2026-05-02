import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import type { PingResult } from '@pingtest/shared';
import { COUNTRY_NAMES, COUNTRY_ALT_NAMES, WORLD_GEOJSON_URLS } from '@pingtest/shared';

interface Props {
  results: PingResult[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildCountryLatencyMap(results: PingResult[]): Map<string, number | null> {
  const map = new Map<string, { sum: number; count: number; hasFail: boolean }>();
  for (const r of results) {
    const existing = map.get(r.country);
    if (r.avgLatency !== null) {
      if (!existing) {
        map.set(r.country, { sum: r.avgLatency, count: 1, hasFail: false });
      } else {
        existing.sum += r.avgLatency;
        existing.count += 1;
      }
    } else if (!existing) {
      map.set(r.country, { sum: 0, count: 0, hasFail: true });
    }
  }
  const out = new Map<string, number | null>();
  for (const [code, v] of map) {
    if (v.hasFail) out.set(code, null);
    else out.set(code, Math.round(v.sum / v.count));
  }
  return out;
}

function matchFeatureToIso(feature: any): string | null {
  const props = feature.properties || {};
  const name = props.name || props.NAME || props.Name || '';
  const iso2 = props.iso2 || props.ISO_A2 || props.iso_a2 || props.iso_3166_1 || '';

  if (iso2 && COUNTRY_NAMES[iso2.toUpperCase()]) return iso2.toUpperCase();

  if (name) {
    for (const [code, altNames] of Object.entries(COUNTRY_ALT_NAMES)) {
      for (const alt of altNames) {
        if (name.toLowerCase() === alt.toLowerCase() || name.includes(alt) || alt.includes(name)) {
          return code;
        }
      }
    }
    for (const [code, cname] of Object.entries(COUNTRY_NAMES)) {
      if (name.toLowerCase() === cname.toLowerCase()) return code;
    }
  }
  return null;
}

export default function WorldMap({ results }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const countryLatency = useMemo(() => buildCountryLatencyMap(results), [results]);

  useEffect(() => {
    if (!chartRef.current) return;

    let cancelled = false;

    async function tryLoad(urls: string[]): Promise<any> {
      for (const url of urls) {
        try {
          const resp = await fetch(url);
          if (resp.ok) return resp.json();
        } catch { /* try next */ }
      }
      throw new Error('All world GeoJSON URLs failed');
    }

    tryLoad(WORLD_GEOJSON_URLS)
      .then((geoJson) => {
        if (!chartRef.current || cancelled) return;

        echarts.registerMap('world', geoJson);

        if (!instanceRef.current) {
          instanceRef.current = echarts.init(chartRef.current);
        }

        const mapData: { name: string; value: number }[] = [];

        geoJson.features.forEach((feature: any) => {
          const iso = matchFeatureToIso(feature);
          const featureName = feature.properties?.name || feature.properties?.NAME || '';
          const latency = iso ? countryLatency.get(iso) : undefined;

          if (iso && latency !== undefined && latency !== null) {
            mapData.push({ name: featureName, value: latency });
          } else if (iso && latency === null) {
            // Probe exists but all packets lost → mark as failed (value = -2)
            mapData.push({ name: featureName, value: -2 });
          } else {
            // No probe in this country
            mapData.push({ name: featureName, value: -1 });
          }
        });

        const option: echarts.EChartsOption = {
          tooltip: {
            trigger: 'item',
            backgroundColor: '#1f2937',
            borderColor: '#374151',
            textStyle: { color: '#e5e7eb', fontSize: 13 },
            formatter: (params: any) => {
              const v = params.value;
              if (v === -1 || v === undefined) {
                return `<strong>${params.name}</strong><br/><span style="color:#6b7280">No probe deployed</span>`;
              }
              if (v === -2) {
                return `<strong>${params.name}</strong><br/><span style="color:#ef4444">Probe failed — 100% packet loss</span>`;
              }
              const color = v < 150 ? '#22c55e' : v < 300 ? '#eab308' : v < 500 ? '#f97316' : '#ef4444';
              return `<strong>${params.name}</strong><br/>Latency: <span style="color:${color};font-weight:bold">${v} ms</span>`;
            },
          },
          visualMap: {
            type: 'piecewise',
            show: true,
            pieces: [
              { value: -1, color: '#374151', label: 'No probe' },
              { value: -2, color: '#991b1b', label: 'Failed' },
              { min: 0, max: 50, color: '#22c55e', label: '<50ms' },
              { min: 50, max: 150, color: '#84cc16', label: '50–150ms' },
              { min: 150, max: 300, color: '#eab308', label: '150–300ms' },
              { min: 300, max: 500, color: '#f97316', label: '300–500ms' },
              { min: 500, color: '#ef4444', label: '500ms+' },
            ],
            left: 'left',
            bottom: 10,
            textStyle: { color: '#9ca3af' },
          },
          series: [
            {
              name: 'Latency',
              type: 'map',
              map: 'world',
              roam: true,
              zoom: 1.2,
              center: [15, 20],
              scaleLimit: { min: 1, max: 5 },
              label: { show: false },
              emphasis: {
                label: { show: true, color: '#e2e8f0', fontSize: 12 },
                itemStyle: { areaColor: '#4b5563', borderColor: '#9ca3af', borderWidth: 1.5 },
              },
              itemStyle: { borderColor: '#475569', borderWidth: 0.5 },
              data: mapData,
            },
          ],
        };

        instanceRef.current.setOption(option, true);
      })
      .catch((err) => {
        console.error('Failed to load world map GeoJSON:', err);
        if (chartRef.current && !instanceRef.current) {
          instanceRef.current = echarts.init(chartRef.current);
        }
        if (instanceRef.current) {
          instanceRef.current.setOption({
            title: {
              text: 'World map unavailable',
              subtext: 'GeoJSON failed to load',
              left: 'center', top: 'center',
              textStyle: { color: '#9ca3af', fontSize: 14 },
              subtextStyle: { color: '#6b7280', fontSize: 12 },
            },
          });
        }
      });

    const handleResize = () => instanceRef.current?.resize();
    window.addEventListener('resize', handleResize);
    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [countryLatency]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  return (
    <div className="map-container">
      <div ref={chartRef} className="h-[400px] w-full" />
    </div>
  );
}
