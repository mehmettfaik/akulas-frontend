import apiClient from './api';
import type { 
  VehicleReportResponse, 
  RouteReportResponse, 
  SummaryReportResponse, 
  DateRangeReportResponse,
  ApiResponse 
} from '../types';

export const reportService = {
  // Araç raporu
  getByVehicle: async (
    vehicleNumber: number, 
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<VehicleReportResponse>> => {
    const response = await apiClient.get(`/reports/vehicle/${vehicleNumber}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Hat raporu
  getByRoute: async (
    routeName: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<RouteReportResponse>> => {
    const response = await apiClient.get(`/reports/route/${routeName}`, {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Özet rapor
  getSummary: async (
    startDate?: string, 
    endDate?: string
  ): Promise<ApiResponse<SummaryReportResponse>> => {
    const response = await apiClient.get('/reports/summary', {
      params: { startDate, endDate }
    });
    return response.data;
  },

  // Tarih aralığı raporu
  getByDateRange: async (
    startDate: string, 
    endDate: string
  ): Promise<ApiResponse<DateRangeReportResponse>> => {
    const response = await apiClient.get('/reports/date-range', {
      params: { startDate, endDate }
    });
    return response.data;
  },
};
