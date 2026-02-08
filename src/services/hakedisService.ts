import apiClient from './api';
import type { HakedisFormData, HakedisRecord, ApiResponse, WeeklyHakedisSummaryResponse } from '../types';

export const hakedisService = {
  create: async (data: HakedisFormData): Promise<ApiResponse<HakedisRecord>> => {
    const response = await apiClient.post('/hakedis', data);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<HakedisRecord[]>> => {
    const response = await apiClient.get('/hakedis');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<HakedisRecord>> => {
    const response = await apiClient.get(`/hakedis/${id}`);
    return response.data;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<ApiResponse<HakedisRecord[]>> => {
    const response = await apiClient.get('/hakedis/range', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  getWeeklyHakedisSummary: async (startDate: string, endDate: string): Promise<ApiResponse<WeeklyHakedisSummaryResponse>> => {
    const response = await apiClient.get('/hakedis/weekly/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  },
};
