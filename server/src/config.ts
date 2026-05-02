import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),

  serverName: process.env.SERVER_NAME || 'Local Server',
  serverCountry: process.env.SERVER_COUNTRY || 'CN',
  serverRegion: process.env.SERVER_REGION || null,
  serverLat: parseFloat(process.env.SERVER_LAT || '39.9042'),
  serverLng: parseFloat(process.env.SERVER_LNG || '116.4074'),
  serverProvider: process.env.SERVER_PROVIDER || 'Local',

  defaultPingCount: 4,
  maxPingCount: 10,
  defaultPingTimeout: 3000,

  remoteProbes: (process.env.REMOTE_PROBES || '').split(',').filter(Boolean),

  boceApiKey: process.env.BOCE_API_KEY || '',

  corsOrigin: process.env.CORS_ORIGIN || '*',
};
