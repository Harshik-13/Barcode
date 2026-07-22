import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT || '5173'),
      allowedHosts: [
        'passport.vjstartup.com',
        'dev-passport.vjstartup.com',
        'localhost',
        '.vjstartup.com'
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 4000,
      allowedHosts: [
        'passport.vjstartup.com',
        'dev-passport.vjstartup.com',
        'localhost',
        '.vjstartup.com'
      ],
    },
    base: '/',
  }
})
