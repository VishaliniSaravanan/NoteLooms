// API Configuration
// 
// IMPORTANT FOR DEPLOYMENT (Render, Vercel, etc.):
// - You MUST set VITE_API_BASE environment variable to your backend URL
// - Example: VITE_API_BASE=https://your-backend.onrender.com
// - The backend URL must be publicly accessible (not localhost/127.0.0.1)
// - Backend URL should use HTTPS if frontend uses HTTPS (browser security requirement)
// - Mobile devices cannot access localhost - they need the actual backend URL
//
// For local development:
// - Defaults to http://127.0.0.1:5000 (works on same machine only)
// - Or create .env.local with: VITE_API_BASE=http://127.0.0.1:5000

const getApiBase = () => {
  const envApiBase = import.meta.env.VITE_API_BASE;
  
  if (envApiBase) {
    return envApiBase;
  }
  
  // Check if we're in production (not localhost)
  const isProduction = typeof window !== 'undefined' && 
                       window.location.hostname !== 'localhost' && 
                       window.location.hostname !== '127.0.0.1' &&
                       !window.location.hostname.startsWith('192.168.') &&
                       !window.location.hostname.startsWith('10.');
  
  if (isProduction) {
    // In production without VITE_API_BASE set, this will fail on mobile
    // Log warning to help debug the issue
    console.warn(
      '⚠️ VITE_API_BASE environment variable is not set! ' +
      'Backend API calls may fail, especially on mobile devices. ' +
      'Please set VITE_API_BASE to your backend URL ' +
      '(e.g., https://your-backend.onrender.com) in your deployment environment variables ' +
      'and rebuild the frontend.'
    );
    // Fallback to relative path (will only work if backend is on same domain with proxy)
    // For separate services on Render, this will fail - user MUST set VITE_API_BASE
    return '/api';
  }
  
  // Local development default
  return "http://127.0.0.1:5000";
};

export const API_BASE = getApiBase();

export const endpoint = (path) => {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${normalizedPath}`;
};


