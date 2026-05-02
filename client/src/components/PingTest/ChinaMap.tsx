import { useEffect, useRef, useMemo } from 'react';
import * as echarts from 'echarts';
import type { PingResult } from '@pingtest/shared';
import { CN_PROVINCE_NAME_MAP } from '@pingtest/shared';

interface Props {
  results: PingResult[];
}

const CHINA_MAP_URL = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

function buildProvinceLatencyMap(results: PingResult[]): Map<string, number | null> {
  const map = new Map<string, number | null>();
  for (const r of results) {
    if (r.country !== 'CN') continue;
    const cnName = CN_PROVINCE_NAME_MAP[r.region || ''] || r.region || '';
    if (cnName) {
      map.set(cnName, r.avgLatency);
    }
  }
  return map;
}

export default function ChinaMap({ results }: Props) {
  const chartRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<echarts.ECharts | null>(null);

  const provinceLatency = useMemo(() => buildProvinceLatencyMap(results), [results]);
  const chinaResults = useMemo(() => results.filter((r) => r.country === 'CN'), [results]);

  useEffect(() => {
    if (!chartRef.current) return;
    if (chinaResults.length === 0) return;

    let cancelled = false;

    fetch(CHINA_MAP_URL)
      .then((r) => r.json())
      .then((geoJson) => {
        if (!chartRef.current || cancelled) return;

        echarts.registerMap('china', geoJson);

        if (!instanceRef.current) {
          instanceRef.current = echarts.init(chartRef.current);
        }

        const mapData = geoJson.features.map((feature: any) => {
          const name = feature.properties?.name || '';
          const latency = provinceLatency.get(name);
          if (latency !== undefined && latency !== null) {
            return { name, value: latency };
          }
          if (latency === null) {
            return { name, value: -2 }; // probe exists but failed
          }
          return { name, value: -1 }; // no probe
        });

        // Also add provinces that are in results but maybe missing from GeoJSON
        for (const [cnName, latency] of provinceLatency) {
          if (!mapData.find((d: any) => d.name === cnName)) {
            mapData.push({ name: cnName, value: latency !== null ? latency : -2 });
          }
        }

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
              map: 'china',
              roam: true,
              zoom: 1.2,
              center: [104.5, 36],
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
        console.error('Failed to load China map GeoJSON:', err);
        if (chartRef.current && !instanceRef.current) {
          instanceRef.current = echarts.init(chartRef.current);
        }
        if (instanceRef.current) {
          instanceRef.current.setOption({
            title: {
              text: 'China map unavailable',
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
  }, [chinaResults, provinceLatency]);

  useEffect(() => {
    return () => {
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  if (chinaResults.length === 0) {
    return (
      <div className="map-container flex items-center justify-center h-[400px]">
        <div className="text-center text-gray-500">
          <svg className="w-10 h-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm">No China probes deployed</p>
          <p className="text-xs mt-1 text-gray-600">
            Deploy a probe to a Chinese mainland server to see results here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={chartRef} className="h-[400px] w-full" />
    </div>
  );
}
