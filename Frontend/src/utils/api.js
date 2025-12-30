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
  // Support both VITE_API_BASE and VITE_BACKEND_URL for compatibility
  // Prefer VITE_API_BASE if set
  // TEMPORARY FIX: Fallback to hardcoded backend URL if env vars not available during build
  const envApiBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_BACKEND_URL || 'https://notelooms.onrender.com';
  
  // Debug logging to help troubleshoot
  if (typeof window !== 'undefined') {
    console.log('🔍 API Configuration Debug:', {
      'VITE_API_BASE': import.meta.env.VITE_API_BASE,
      'VITE_BACKEND_URL': import.meta.env.VITE_BACKEND_URL,
      'Using': envApiBase || 'FALLBACK',
      'Mode': import.meta.env.MODE,
      'All env vars': Object.keys(import.meta.env).filter(k => k.startsWith('VITE_'))
    });
  }
  
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
    // In production without VITE_BACKEND_URL or VITE_API_BASE set, this will fail on mobile
    // Log warning to help debug the issue
    console.warn(
      '⚠️ VITE_BACKEND_URL or VITE_API_BASE environment variable is not set! ' +
      'Backend API calls may fail, especially on mobile devices. ' +
      'Please set VITE_BACKEND_URL (or VITE_API_BASE) to your backend URL ' +
      '(e.g., https://your-backend.onrender.com) in your deployment environment variables ' +
      'and rebuild the frontend.'
    );
    // Fallback to relative path (will only work if backend is on same domain with proxy)
    // For separate services on Render, this will fail - user MUST set VITE_BACKEND_URL or VITE_API_BASE
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


