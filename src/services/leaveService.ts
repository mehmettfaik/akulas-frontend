import apiClient from './api';
import type { Employee, LeaveRequest, LeaveEntitlement, ApiResponse } from '../types';

export interface CreateEmployeeData {
  firstName: string;
  lastName: string;
  tcNo: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  startDate: string;
  isActive: boolean;
}

export interface CreateLeaveRequestData {
  employeeId: string;
  leaveType: 'annual' | 'sick' | 'excuse' | 'unpaid';
  startDate: string;
  endDate: string;
  description?: string;
}

export const leaveService = {
  // ÇALIŞAN CRUD
  getAllEmployees: async (): Promise<ApiResponse<Employee[]>> => {
    const response = await apiClient.get('/leave/employees');
    return response.data;
  },

  getEmployeeById: async (id: string): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.get(`/leave/employees/${id}`);
    return response.data;
  },

  createEmployee: async (data: CreateEmployeeData): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.post('/leave/employees', data);
    return response.data;
  },

  updateEmployee: async (id: string, data: Partial<CreateEmployeeData>): Promise<ApiResponse<Employee>> => {
    const response = await apiClient.put(`/leave/employees/${id}`, data);
    return response.data;
  },

  deleteEmployee: async (id: string): Promise<ApiResponse<void>> => {
    const response = await apiClient.delete(`/leave/employees/${id}`);
    return response.data;
  },

  // İZİN KAYITLARI
  getLeaveRequests: async (params?: { employeeId?: string; status?: string; year?: number }): Promise<ApiResponse<LeaveRequest[]>> => {
    const response = await apiClient.get('/leave/requests', { params });
    return response.data;
  },

  createLeaveRequest: async (data: CreateLeaveRequestData): Promise<ApiResponse<LeaveRequest>> => {
    const response = await apiClient.post('/leave/requests', data);
    return response.data;
  },

  reviewLeaveRequest: async (id: string, action: 'approve' | 'reject', notes?: string): Promise<ApiResponse<LeaveRequest>> => {
    const response = await apiClient.patch(`/leave/requests/${id}/review`, { action, notes });
    return response.data;
  },

  cancelLeaveRequest: async (id: string): Promise<ApiResponse<LeaveRequest>> => {
    const response = await apiClient.patch(`/leave/requests/${id}/cancel`);
    return response.data;
  },

  // İZİN HAKEDİŞLERİ
  getLeaveEntitlements: async (employeeId: string, year?: number): Promise<ApiResponse<LeaveEntitlement[]>> => {
    const response = await apiClient.get(`/leave/entitlements/${employeeId}`, {
      params: { year }
    });
    return response.data;
  },

  getAllEntitlements: async (year?: number): Promise<ApiResponse<LeaveEntitlement[]>> => {
    const response = await apiClient.get('/leave/entitlements', {
      params: { year }
    });
    return response.data;
  },
};
