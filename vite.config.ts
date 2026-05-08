import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// In dev, Vite proxies /api → cuopt-ev-routing-backend (FastAPI) and
// /auth → accelerator-pack-auth-service. Run them on different ports
// (defaults: BE 8081, auth 8080) since both default to 8080.
//
// In production, the OKE ingress (configured in ai-accelerator-starter-packs
// blueprint_files.tf) routes /api/* and /auth/* to the right pods. The
// proxy below is dev-only.
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
