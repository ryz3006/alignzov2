import type { NextConfig } from "next";
import fs from 'fs';
import path from 'path';

// Try to read standardized config.json to map API proxy dynamically
let apiUrl: string | undefined;
let usedConfigSource = 'none';
let firebaseFromConfig:
  | {
      apiKey?: string;
      authDomain?: string;
      projectId?: string;
      storageBucket?: string;
      messagingSenderId?: string;
      appId?: string;
      measurementId?: string;
    }
  | undefined;
try {
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    const cfg = JSON.parse(raw);
    apiUrl = cfg?.apiUrl || cfg?.backend?.apiUrl || (cfg?.ports?.backend ? `http://localhost:${cfg.ports.backend}` : undefined);
    usedConfigSource = 'frontend/config/config.json';
    firebaseFromConfig = cfg?.firebase;
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
  async headers() {
    return [
      {
        // Ensure Firebase auth popups can communicate with the opener
        source: '/:path*',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Explicitly disable COEP to avoid isolating the browsing context which breaks popups
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ];
  },
  eslint: {
    // Prevent ESLint errors from failing production builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Prevent type errors from failing production builds
    ignoreBuildErrors: true,
  },
  env: {
    ALIGNZO_START_MODE: process.env.NODE_ENV === 'production' ? 'PROD' : 'DEV',
    ALIGNZO_CONFIG_SOURCE: usedConfigSource,
    // Expose API base URL to client
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || apiUrl || 'http://localhost:3001',
    // Map Firebase config from file if present (can be overridden by real envs)
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseFromConfig?.apiKey || '',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseFromConfig?.authDomain || '',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseFromConfig?.projectId || '',
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseFromConfig?.storageBucket || '',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseFromConfig?.messagingSenderId || '',
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseFromConfig?.appId || '',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || firebaseFromConfig?.measurementId || '',
  },
};

export default nextConfig;
