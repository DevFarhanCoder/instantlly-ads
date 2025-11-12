import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'https://instantlly-cards-backend-6ki0.onrender.com';

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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if it's an authentication error with invalid token format
    if (
      error.response?.status === 401 &&
      error.response?.data?.message?.includes('Invalid user ID format in token')
    ) {
      console.log('🔄 Invalid token detected - auto-clearing and redirecting to login');
      
      // Clear the invalid token
      localStorage.removeItem('authToken');
      localStorage.removeItem('adminData');
      
      // Redirect to login page
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      
      return Promise.reject(new Error('Session expired. Please login again.'));
    }
    
    return Promise.reject(error);
  }
);

export default api;
