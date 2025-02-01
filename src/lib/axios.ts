import axios from 'axios';
import { toast } from 'react-hot-toast';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// List of endpoints that require admin role
const adminEndpoints = [
  '/admin/users',
  '/admin/activity',
  '/admin/blogs',
  '/admin/security',
  '/admin/stats'
];

// Request interceptor for API calls
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  const tempToken = localStorage.getItem('tempAuthToken');
  const userJson = localStorage.getItem('user');
  const user = userJson ? JSON.parse(userJson) : null;

  // Check if endpoint requires admin role
  const isAdminEndpoint = adminEndpoints.some(endpoint => config.url?.startsWith(endpoint));
  if (isAdminEndpoint && user?.role !== 'admin') {
    throw new Error('Admin access required');
  }

  if (token || tempToken) {
    const authToken = token || tempToken;
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  // Don't set Content-Type for FormData (file uploads)
  if (config.data instanceof FormData) {
    config.headers['Content-Type'] = 'multipart/form-data';
  }
  
  return config;
});

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      // Handle specific error cases
      const status = error.response.status;
      const isPublicRoute = [
        '/blogs',
        '/auth/login',
        '/auth/register',
        '/auth/me'
      ].some(route => error.config.url.includes(route));

      // Only redirect for auth errors on protected routes
      if (status === 401 && !isPublicRoute && localStorage.getItem('token')) {
        localStorage.removeItem('token');
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
          toast.error('Please log in to continue');
        }
      }

      switch (error.response.status) {
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        default:
          if (!isPublicRoute || status !== 401) {
            toast.error(error.response.data.message || 'An error occurred');
          }
      }
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    }
    return Promise.reject(error);
  }
);

export default api;