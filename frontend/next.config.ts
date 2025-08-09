import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Try to read standardized config.json to map API proxy dynamically
let apiUrl: string | undefined;
try {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    apiUrl = cfg?.apiUrl || cfg?.backend?.apiUrl || (cfg?.ports?.backend ? `http://localhost:${cfg.ports.backend}` : undefined);
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
};

export default nextConfig;
