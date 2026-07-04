import apiClient from './api';

export interface Kiosk {
  id: string;
  name: string;
  isActive: boolean;
}

export const kioskService = {
  getAll: async () => {
    const response = await apiClient.get('/kiosks');
    return response.data;
  },
  create: async (name: string) => {
    const response = await apiClient.post('/kiosks', { name });
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/kiosks/${id}`);
    return response.data;
  }
};
