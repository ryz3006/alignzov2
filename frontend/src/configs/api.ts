// API Configuration
// Prefer standardized config.json if available at build/runtime
let standardConfig: any = undefined;
try {
  // Next.js bundles at build time; this read will work only server-side/dev
  // We still fallback to env-based config on client
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs');
  const path = require('path');
  const configPath = path.join(process.cwd(), 'config', 'config.json');
  if (fs.existsSync(configPath)) {
    const raw = fs.readFileSync(configPath, 'utf-8');
    standardConfig = JSON.parse(raw);
  }
} catch {}

export const API_CONFIG = {
  // Base URL for API calls - supports multiple environments
  BASE_URL: (standardConfig?.apiUrl || standardConfig?.backend?.apiUrl) ||
            process.env.NEXT_PUBLIC_API_URL ||
            (process.env.NODE_ENV === 'production' ? 'https://api.alignzo.com' : 'http://localhost:3001'),
  
  // API version for future versioning support
  VERSION: process.env.NEXT_PUBLIC_API_VERSION || 'v1',
  
  // API endpoints - using relative paths for consistency
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      GOOGLE_LOGIN: '/api/auth/google',
      REFRESH: '/api/auth/refresh',
      LOGOUT: '/api/auth/logout',
      PROFILE: '/api/auth/profile',
      ME: '/api/auth/me',
    },
    USERS: {
      LIST: '/api/users',
      CREATE: '/api/users',
      UPDATE: (id: string) => `/api/users/${id}`,
      DELETE: (id: string) => `/api/users/${id}`,
      ASSIGN_ROLE: (id: string) => `/api/users/${id}/roles`,
      SEARCH: '/api/users/search',
      SUBORDINATES: '/api/users/subordinates',
    },
    ROLES: {
      LIST: '/api/roles',
      CREATE: '/api/roles',
      UPDATE: (id: string) => `/api/roles/${id}`,
      DELETE: (id: string) => `/api/roles/${id}`,
      ASSIGN_PERMISSIONS: (id: string) => `/api/roles/${id}/permissions`,
    },
    PERMISSIONS: {
      LIST: '/api/permissions',
      CREATE: '/api/permissions',
      UPDATE: (id: string) => `/api/permissions/${id}`,
      DELETE: (id: string) => `/api/permissions/${id}`,
    },
    PROJECTS: {
      LIST: '/api/projects',
      CREATE: '/api/projects',
      UPDATE: (id: string) => `/api/projects/${id}`,
      DELETE: (id: string) => `/api/projects/${id}`,
    },
    TIME_SESSIONS: {
      LIST: '/api/time-sessions',
      CREATE: '/api/time-sessions',
      UPDATE: (id: string) => `/api/time-sessions/${id}`,
      DELETE: (id: string) => `/api/time-sessions/${id}`,
      PAUSE: (id: string) => `/api/time-sessions/${id}/pause`,
      STOP: (id: string) => `/api/time-sessions/${id}/stop`,
    },
    HEALTH: {
      STATUS: '/api/health',
      DATABASE: '/api/health/db',
      SYSTEM: '/api/health/system',
    },
  },
};

// Helper function to build full API URLs
export const buildApiUrl = (endpoint: string): string => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.BASE_URL}/${cleanEndpoint}`;
};

// Helper function to get API endpoint with versioning support
export const getApiEndpoint = (endpoint: string): string => {
  return `/api/${API_CONFIG.VERSION}${endpoint}`;
};

// Helper function to build full API URL with versioning
export const buildVersionedApiUrl = (endpoint: string): string => {
  return buildApiUrl(getApiEndpoint(endpoint));
}; 