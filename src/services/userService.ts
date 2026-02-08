import apiClient from './api';
import type { User, ApiResponse } from '../types';

export interface CreateUserData {
  email: string;
  password: string;
  displayName: string;
  role: 'admin' | 'responsible' | 'desk';
}

export interface UpdateUserData {
  email?: string;
  displayName?: string;
  role?: 'admin' | 'responsible' | 'desk';
  password?: string;
}

export const userService = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    const response = await apiClient.get('/users');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  create: async (userData: CreateUserData): Promise<ApiResponse<User>> => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  update: async (id: string, userData: UpdateUserData): Promise<ApiResponse<User>> => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },
};
