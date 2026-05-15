import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Dev proxies /api and /auth to the local backend / auth-service. Both
// services default to port 8080 — run the cuopt backend on 8081 locally
// (VITE_CUOPT_BACKEND_URL) so they don't collide. In production the OKE
// ingress handles this routing; this config doesn't apply.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const cuoptBackendUrl = env.VITE_CUOPT_BACKEND_URL || 'http://localhost:8081';
  const authHostUrl = env.VITE_AUTH_HOST || 'http://localhost:8080';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: cuoptBackendUrl,
          changeOrigin: true,
        },
        '/auth': {
          target: authHostUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
