import apiClient from './api';

export interface BanknoteCount {
  b200: number; b100: number; b50: number; b20: number;
  b10: number; b5: number; c1: number; c050: number;
}

export interface KioskDolumRecord {
  id?: string;
  date: string;
  kioskId: string;
  kioskName: string;
  products: { dolum: number };
  categoryCreditCards: { dolum: number };
  payments: { gunbasiNakit: number; krediKarti: number; bankayaGonderilen: number; ertesiGuneBirakilan: number };
  banknotes: { dolum: BanknoteCount };
  bankSentCash: { dolum: number; totalSent: number };
  totals: { totalSales: number; totalCreditCard: number; expectedCash: number; cashInRegister: number; difference: number; totalCash: number };
  status?: 'pending' | 'approved' | 'rejected' | 'pending_revision' | 'teslim_edildi';
  submittedByEmail?: string;
  reviewerNotes?: string;
}

export const kioskDolumService = {
  submit: async (data: any) => {
    const response = await apiClient.post('/kiosk-dolum/submit', data);
    return response.data;
  },
  getSubmitted: async (params?: any) => {
    const response = await apiClient.get('/kiosk-dolum/submitted', { params });
    return response.data;
  },
  getById: async (id: string) => {
    const response = await apiClient.get(`/kiosk-dolum/${id}`);
    return response.data;
  },
  review: async (id: string, status: string, notes?: string) => {
    const response = await apiClient.post(`/kiosk-dolum/${id}/review`, { status, notes });
    return response.data;
  },
  update: async (id: string, data: any) => {
    const response = await apiClient.put(`/kiosk-dolum/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await apiClient.delete(`/kiosk-dolum/${id}`);
    return response.data;
  }
};
