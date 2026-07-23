/// <reference types="vite/client" />

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080',
  appEnv: import.meta.env.VITE_APP_ENV ?? 'development',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '',
} as const;

export const isDev = env.appEnv === 'development';
export const isProd = env.appEnv === 'production';
