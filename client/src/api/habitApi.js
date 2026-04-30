import axiosInstance from './axiosInstance';

export const habitApi = {
  getAll: async () => {
    const res = await axiosInstance.get('/habits');
    return res.data;
  },
  create: async (data) => {
    const res = await axiosInstance.post('/habits', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await axiosInstance.put(`/habits/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await axiosInstance.delete(`/habits/${id}`);
    return res.data;
  },
  toggle: async (id, date) => {
    const res = await axiosInstance.patch(`/habits/${id}/toggle`, { date });
    return res.data;
  },
  archive: async (id) => {
    const res = await axiosInstance.patch(`/habits/${id}/archive`);
    return res.data;
  },
  reorder: async (orderedIds) => {
    const res = await axiosInstance.patch('/habits/reorder', { orderedIds });
    return res.data;
  },
};

export const noteApi = {
  getAll: async () => {
    const res = await axiosInstance.get('/notes');
    return res.data;
  },
  create: async (content) => {
    const res = await axiosInstance.post('/notes', { content });
    return res.data;
  },
  delete: async (id) => {
    const res = await axiosInstance.delete(`/notes/${id}`);
    return res.data;
  },
};

export const userApi = {
  updateSettings: async (data) => {
    const res = await axiosInstance.put('/user/settings', data);
    return res.data;
  },
  getPublicProfile: async (username) => {
    const res = await axiosInstance.get(`/user/${username}/public`);
    return res.data;
  },
  deleteAccount: async () => {
    const res = await axiosInstance.delete('/user');
    return res.data;
  },
  exportCSV: () => {
    window.open(`${axiosInstance.defaults.baseURL}/export/csv`, '_blank');
  },
};
