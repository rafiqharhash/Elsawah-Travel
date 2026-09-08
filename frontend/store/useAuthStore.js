import { create } from 'zustand';
import { api } from '../services/api';
export const useAuthStore = create(set => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isAuthenticated: !!(typeof window !== 'undefined' ? localStorage.getItem('token') : null),
  login: async (phone, password) => {
    const {
      data
    } = await api.post('/auth/login', {
      phone,
      password
    });
    localStorage.setItem('token', data.data.token);
    set({
      user: data.data.user,
      token: data.data.token,
      isAuthenticated: true
    });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({
      user: null,
      token: null,
      isAuthenticated: false
    });
  }
}));