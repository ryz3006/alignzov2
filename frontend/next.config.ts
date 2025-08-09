import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Try to read standardized config.json to map API proxy dynamically
let apiUrl: string | undefined;
let usedConfigSource = 'none';
try {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    apiUrl = cfg?.apiUrl || cfg?.backend?.apiUrl || (cfg?.ports?.backend ? `http://localhost:${cfg.ports.backend}` : undefined);
    usedConfigSource = 'frontend/config/config.json';
  }
} catch {}

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (apiUrl || 'http://localhost:3001') + '/api/:path*',
      },
    ];
  },
  env: {
    ALIGNZO_START_MODE: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
    ALIGNZO_CONFIG_SOURCE: usedConfigSource,
  },
};

export default nextConfig;
