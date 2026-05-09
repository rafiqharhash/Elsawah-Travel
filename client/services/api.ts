import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const isStudentEndpoint = config.url?.startsWith('/student') || config.url === '/bookings';
    const token = isStudentEndpoint 
      ? (localStorage.getItem('student_token') || localStorage.getItem('token'))
      : (localStorage.getItem('token') || localStorage.getItem('student_token'));
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle global errors here (e.g., token expiration -> logout)
    return Promise.reject(error);
  }
);
