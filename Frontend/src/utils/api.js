export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:5000";

export const endpoint = (path) => `${API_BASE}${path}`;


