import axiosInstance from './axiosInstance';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const authApi = {
  register: async (data) => {
    // Returns { accessToken, user }
    const res = await axiosInstance.post('/auth/register', data);
    return res.data;
  },
  login: async (data) => {
    // Returns { accessToken, user } — refresh token set as httpOnly cookie by server
    const res = await axiosInstance.post('/auth/login', data);
    return res.data;
  },
  logout: async () => {
    // Clears httpOnly cookie server-side
    await axiosInstance.post('/auth/logout');
  },
  refresh: async () => {
    // Returns { accessToken, user } using the httpOnly cookie
    const res = await axios.post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true });
    return res.data;
  },
  getMe: async () => {
    const res = await axiosInstance.get('/auth/me');
    return res.data;
  },
  forgotPassword: async (email) => {
    const res = await axiosInstance.post('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (token, password) => {
    const res = await axiosInstance.post(`/auth/reset-password/${token}`, { password });
    return res.data;
  },
};
