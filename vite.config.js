import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiGateway = env.VITE_API_GATEWAY_URL || 'http://localhost:8000';

  console.log(`[Vite] Mode: "${mode}" | API Gateway: "${apiGateway}"`);

  return {
    plugins: [react()],
    server: {
      port: 3000,
      strictPort: true,
      proxy: {
        '/auth': {
          target: apiGateway,
          changeOrigin: true,
          secure: false,
        },
        '/b2b': {
          target: apiGateway,
          changeOrigin: true,
          secure: false,
        },
        '/b2b-backend': {
          target: apiGateway,
          changeOrigin: true,
          secure: false,
        },
      },
    }
  };
});

