import axios from 'axios';

// AWS Cloud (Primary) with Render backup
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://api.instantllycards.com';
const BACKUP_API_URL = 'https://instantlly-cards-backend-6ki0.onrender.com';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors automatically
let isRedirecting = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's an authentication error
    if (error.response?.status === 401 && !isRedirecting) {
      // Don't redirect if we're already on the login page or already redirecting
      const isLoginPage = typeof window !== 'undefined' && window.location.pathname === '/login';
      
      if (!isLoginPage) {
        console.log('🔄 Authentication failed - clearing token and redirecting to login');
        isRedirecting = true;
        
        // Clear the invalid token
        localStorage.removeItem('authToken');
        localStorage.removeItem('adminData');
        
        // Redirect to login page
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
