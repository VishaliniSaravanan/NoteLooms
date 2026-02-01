// API Configuration
//
// BACKEND URL (paste your URL when you deploy):
// - Set VITE_BACKEND_URL in .env or .env.production to your backend URL.
// - Local dev: use .env.local with VITE_BACKEND_URL=http://127.0.0.1:5000
// - Production: set VITE_BACKEND_URL=https://YOUR-BACKEND-URL (e.g. your Render/Railway/Vercel backend)
//
// Template – when you have a backend URL, set it via env or paste below:
// const BACKEND_URL_TEMPLATE = 'https://your-backend.example.com';

const BACKEND_URL_TEMPLATE = ''; // optional: paste your backend URL here if not using .env

const DEFAULT_DEV_URL = 'http://127.0.0.1:5000';

function getApiBase() {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  if (envUrl) return envUrl;
  if (BACKEND_URL_TEMPLATE) return BACKEND_URL_TEMPLATE;
  return import.meta.env.DEV ? DEFAULT_DEV_URL : '';
}

// Resolved once at load
export const API_BASE = getApiBase();

export function endpoint(path) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return API_BASE ? `${API_BASE}${normalized}` : normalized;
}
