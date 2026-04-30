import axiosInstance from './axiosInstance';

export const analyticsApi = {
  getSummary: async () => {
    const res = await axiosInstance.get('/analytics/summary');
    return res.data;
  },
  getHeatmap: async () => {
    const res = await axiosInstance.get('/analytics/heatmap');
    return res.data;
  },
  getMonthly: async () => {
    const res = await axiosInstance.get('/analytics/monthly');
    return res.data;
  },
  getHabitTrend: async (id) => {
    const res = await axiosInstance.get(`/analytics/habits/${id}`);
    return res.data;
  },
};
