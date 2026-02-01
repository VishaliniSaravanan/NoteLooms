// API Configuration
// 
// IMPORTANT FOR DEPLOYMENT (Render):
// - You MUST set VITE_BACKEND_URL or VITE_API_BASE environment variable to your backend URL
// - Example: VITE_BACKEND_URL=https://your-backend.onrender.com
// - The backend URL must be publicly accessible (not localhost/127.0.0.1)
// - Backend URL should use HTTPS if frontend uses HTTPS (browser security requirement)
// - Mobile devices cannot access localhost - they need the actual backend URL
//
// For local development:
// - Defaults to http://127.0.0.1:5000 (works on same machine only)
// - Or create .env.local with: VITE_BACKEND_URL=http://127.0.0.1:5000

const getApiBase = () => {
  // Primary backend URL
  const backendUrl = 'https://notelooms.onrender.com';
  
  // Allow override via VITE_BACKEND_URL for local development
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL;
  
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    console.log(' API Configuration Debug:', {
      'VITE_BACKEND_URL': import.meta.env.VITE_BACKEND_URL,
      'Using': envBackendUrl || backendUrl,
      'Mode': import.meta.env.MODE,
    });
  }

  // Use environment variable if set, otherwise use main backend URL
  return envBackendUrl || backendUrl;
};

export const API_BASE = getApiBase();

export const endpoint = (path) => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};


