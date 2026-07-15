import axios from 'axios';
import useMusicStore from './musicStore'; // 🟢 Added to handle auto-logout

// 🟢 LOGIC: Environment-aware URL switching
export const API_URL = import.meta.env.PROD 
  ? "https://vibestream2.duckdns.org" 
  : (import.meta.env.VITE_API_URL || 'http://localhost:8007');

export const api = axios.create({
  baseURL: API_URL,
});

// --- 🛡️ REQUEST INTERCEPTOR (Attach Token) ---
api.interceptors.request.use((config) => {
  // 🛑 LOGIC: Do NOT add Authorization header to login or register routes
  if (config.url.includes('/auth/')) {
    return config;
  }

  try {
    const storage = localStorage.getItem('music-pro-storage-v18');
    if (storage) {
      const parsed = JSON.parse(storage);
      const token = parsed.state?.user?.access_token;
      
      // 🟢 LOGIC: Only attach if a valid token exists for the current session
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch (error) {
    console.error("Auth Interceptor Error:", error);
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// --- 🛡️ RESPONSE INTERCEPTOR (The Auth Guard) ---
// This handles the "Expired Token" edge case by forcing a logout on 401 errors
api.interceptors.response.use(
  (response) => response, 
  (error) => {
    // 🛑 LOGIC: If the server returns 401, the token is dead or invalid
    if (error.response && error.response.status === 401) {
      console.warn("🔐 Session expired or invalid. Logging out...");
      
      // Access the logout action directly from the store state
      const { logout } = useMusicStore.getState();
      logout(); // 🧹 Clears user state and localStorage
      
      // Force return to home to trigger the Login Gate in App.jsx
      window.location.href = '/'; 
    }
    return Promise.reject(error);
  }
);

// --- FETCH SONGS ---
export const fetchSongs = async (search, limit, genre, mood, listen, skip = 0, language = 'all') => {
  try {
    const response = await api.get('/songs', {
      params: {
        search: search || '',
        limit: limit || 50,
        skip: skip || 0,
        genre: genre || 'all', 
        mood: mood || 'all', 
        listen: listen || 'all',
        language: language || 'all' 
      },
    });
    return response.data.results;
  } catch (error) {
    console.error("❌ [API ERROR] Failed to fetch songs:", error);
    return [];
  }
};

export const fetchRecommendations = async (limit = 60, userId = 'anonymous') => {
  try {
    const response = await api.post('/bot/personalized', {
      user_id: userId,
      history: [],
      limit,
    });
    return response.data.results || [];
  } catch (error) {
    console.error("Recommendation fetch failed:", error);
    return [];
  }
};

// --- STREAMING UTILITY ---
export const getStreamUrl = (msgId) => {
  if (!msgId) return '';
  return `${API_URL}/stream/${msgId}`;
};
