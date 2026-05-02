import type { ProbeLocation } from './types.js';

/** Default ping settings */
export const DEFAULT_PING_COUNT = 4;
export const MAX_PING_COUNT = 10;
export const DEFAULT_PING_TIMEOUT = 3000;

/** Predefined China probe locations (for future deployment) */
export const CHINA_PROBE_LOCATIONS: ProbeLocation[] = [
  { id: 'cn-beijing',   name: 'Beijing',   country: 'CN', region: 'Beijing',       lat: 39.9042,  lng: 116.4074, provider: 'Alibaba Cloud' },
  { id: 'cn-shanghai',  name: 'Shanghai',  country: 'CN', region: 'Shanghai',      lat: 31.2304,  lng: 121.4737, provider: 'Alibaba Cloud' },
  { id: 'cn-guangzhou', name: 'Guangzhou', country: 'CN', region: 'Guangdong',     lat: 23.1291,  lng: 113.2644, provider: 'Alibaba Cloud' },
  { id: 'cn-chengdu',   name: 'Chengdu',   country: 'CN', region: 'Sichuan',       lat: 30.5728,  lng: 104.0668, provider: 'Alibaba Cloud' },
  { id: 'cn-hangzhou',  name: 'Hangzhou',  country: 'CN', region: 'Zhejiang',      lat: 30.2741,  lng: 120.1551, provider: 'Alibaba Cloud' },
];

/**
 * Mapping from ISO 3166-1 alpha-2 country codes to English country names.
 * Used to match probe results against world GeoJSON features.
 */
export const COUNTRY_NAMES: Record<string, string> = {
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  DE: 'Germany',
  GB: 'United Kingdom',
  NL: 'Netherlands',
  US: 'United States',
  CA: 'Canada',
  BR: 'Brazil',
  AE: 'United Arab Emirates',
  IN: 'India',
  AU: 'Australia',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  RU: 'Russia',
  ID: 'Indonesia',
  TH: 'Thailand',
  VN: 'Vietnam',
  MY: 'Malaysia',
  PH: 'Philippines',
  TW: 'Taiwan',
  HK: 'Hong Kong',
  MO: 'Macau',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  NZ: 'New Zealand',
  SE: 'Sweden',
  CH: 'Switzerland',
  PL: 'Poland',
  UA: 'Ukraine',
  TR: 'Turkey',
  SA: 'Saudi Arabia',
  IL: 'Israel',
  PK: 'Pakistan',
  BD: 'Bangladesh',
};

/** Alternative country names that might appear in GeoJSON */
export const COUNTRY_ALT_NAMES: Record<string, string[]> = {
  CN: ['China', "People's Republic of China", '中华人民共和国'],
  JP: ['Japan'],
  KR: ['South Korea', 'Korea, Republic of', 'Republic of Korea'],
  SG: ['Singapore'],
  DE: ['Germany'],
  GB: ['United Kingdom', 'UK', 'Great Britain'],
  NL: ['Netherlands', 'Holland'],
  US: ['United States', 'United States of America', 'USA'],
  CA: ['Canada'],
  BR: ['Brazil'],
  AE: ['United Arab Emirates', 'UAE'],
  IN: ['India'],
  AU: ['Australia'],
  RU: ['Russia', 'Russian Federation'],
  TW: ['Taiwan', 'Taiwan, Province of China'],
  HK: ['Hong Kong'],
};

/**
 * Mapping from English region/province names to Chinese province names
 * used in the DataV China GeoJSON (100000_full.json).
 */
export const CN_PROVINCE_NAME_MAP: Record<string, string> = {
  'Beijing': '北京市',
  'Shanghai': '上海市',
  'Guangdong': '广东省',
  'Sichuan': '四川省',
  'Zhejiang': '浙江省',
  'Tianjin': '天津市',
  'Chongqing': '重庆市',
  'Hebei': '河北省',
  'Shanxi': '山西省',
  'Liaoning': '辽宁省',
  'Jilin': '吉林省',
  'Heilongjiang': '黑龙江省',
  'Jiangsu': '江苏省',
  'Anhui': '安徽省',
  'Fujian': '福建省',
  'Jiangxi': '江西省',
  'Shandong': '山东省',
  'Henan': '河南省',
  'Hubei': '湖北省',
  'Hunan': '湖南省',
  'Hainan': '海南省',
  'Guizhou': '贵州省',
  'Yunnan': '云南省',
  'Shaanxi': '陕西省',
  'Gansu': '甘肃省',
  'Qinghai': '青海省',
  'Guangxi': '广西壮族自治区',
  'Inner Mongolia': '内蒙古自治区',
  'Tibet': '西藏自治区',
  'Ningxia': '宁夏回族自治区',
  'Xinjiang': '新疆维吾尔自治区',
};

/** World GeoJSON URLs to try in order */
export const WORLD_GEOJSON_URLS = [
  'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson',
  'https://cdn.jsdelivr.net/gh/holtzy/D3-graph-gallery@master/DATA/world.geojson',
];

/** Predefined global probe locations (for future deployment) */
export const GLOBAL_PROBE_LOCATIONS: ProbeLocation[] = [
  // East Asia
  { id: 'jp-tokyo',     name: 'Tokyo',        country: 'JP', region: null, lat: 35.6762,  lng: 139.6503, provider: 'AWS' },
  { id: 'kr-seoul',     name: 'Seoul',         country: 'KR', region: null, lat: 37.5665,  lng: 126.9780, provider: 'AWS' },
  // Southeast Asia
  { id: 'sg-singapore', name: 'Singapore',     country: 'SG', region: null, lat: 1.3521,   lng: 103.8198, provider: 'AWS' },
  // Europe
  { id: 'de-frankfurt', name: 'Frankfurt',     country: 'DE', region: null, lat: 50.1109,  lng: 8.6821,   provider: 'Hetzner' },
  { id: 'gb-london',    name: 'London',        country: 'GB', region: null, lat: 51.5074,  lng: -0.1278,  provider: 'AWS' },
  { id: 'nl-amsterdam', name: 'Amsterdam',     country: 'NL', region: null, lat: 52.3676,  lng: 4.9041,   provider: 'AWS' },
  // North America
  { id: 'us-east',      name: 'Virginia',      country: 'US', region: null, lat: 38.9072,  lng: -77.0369, provider: 'AWS' },
  { id: 'us-west',      name: 'Oregon',        country: 'US', region: null, lat: 45.5231,  lng: -122.6765, provider: 'AWS' },
  { id: 'ca-montreal',  name: 'Montreal',      country: 'CA', region: null, lat: 45.5017,  lng: -73.5673, provider: 'OVH' },
  // South America
  { id: 'br-sao-paulo', name: 'Sao Paulo',     country: 'BR', region: null, lat: -23.5505, lng: -46.6333, provider: 'AWS' },
  // Middle East
  { id: 'ae-dubai',     name: 'Dubai',         country: 'AE', region: null, lat: 25.2048,  lng: 55.2708,  provider: 'AWS' },
  // South Asia
  { id: 'in-mumbai',    name: 'Mumbai',        country: 'IN', region: null, lat: 19.0760,  lng: 72.8777,  provider: 'AWS' },
  // Oceania
  { id: 'au-sydney',    name: 'Sydney',        country: 'AU', region: null, lat: -33.8688, lng: 151.2093, provider: 'AWS' },
];
