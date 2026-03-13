/**
 * API client for the EV Routing backend.
 *
 * In dev mode Vite proxies /api → backend:8000.
 * In container mode VITE_BACKEND_URL is injected at startup via env-config.js.
 */
import axios from 'axios';

const backendUrl = window.__ENV__?.VITE_BACKEND_URL;
const client = axios.create({
  baseURL: backendUrl ? `${backendUrl}/api` : '/api',
});

/**
 * Health check.
 * @returns {Promise<{status: string}>}
 */
export async function healthCheck() {
  const { data } = await client.get('/healthz');
  return data;
}

export default client;
