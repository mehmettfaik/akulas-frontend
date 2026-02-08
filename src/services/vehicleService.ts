import apiClient from './api';
import type { Vehicle, ApiResponse } from '../types';

export const vehicleService = {
  getAll: async (): Promise<ApiResponse<Vehicle[]>> => {
    const response = await apiClient.get('/vehicles');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Vehicle>> => {
    const response = await apiClient.get(`/vehicles/${id}`);
    return response.data;
  },

  create: async (vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Vehicle>> => {
    const response = await apiClient.post('/vehicles', vehicle);
    return response.data;
  },

  update: async (id: string, vehicle: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> => {
    const response = await apiClient.put(`/vehicles/${id}`, vehicle);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/vehicles/${id}`);
    return response.data;
  },
};
