import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const useHttps = env.VITE_USE_HTTPS === 'true'
  
  // HTTPS configuration
  let httpsConfig: any = false
  if (useHttps) {
    const certPath = path.resolve(__dirname, 'cert.pem')
    const keyPath = path.resolve(__dirname, 'key.pem')
    
    // Check if cert files exist
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      httpsConfig = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      }
      console.log('✅ Using HTTPS with generated certificates')
    } else {
      console.warn('⚠️ HTTPS enabled but certificates not found. Run: openssl req -x509 -newkey rsa:2048 -nodes -sha256 -subj "/CN=localhost" -keyout key.pem -out cert.pem -days 365')
    }
  }
  
  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: parseInt(env.VITE_PORT || '5174'),
      https: httpsConfig,
      allowedHosts: [
        'scanner.vjstartup.com',
        'dev-scanner.vjstartup.com',
        'localhost',
        '.vjstartup.com'
      ],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 6000,
      https: httpsConfig,
      allowedHosts: [
        'scanner.vjstartup.com',
        'dev-scanner.vjstartup.com',
        'localhost',
        '.vjstartup.com'
      ],
    },
    base: '/',
  }
})
