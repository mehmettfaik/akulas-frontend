import apiClient from './api';

export interface BayiDolumSubmitData {
  date: string;
  products: {
    bayiDolum: number;
    bayiTamKart: number;
    bayiKartKilifi: number;
    posRulosu: number;
  };
  categoryCreditCards: {
    dolum: number;
    kart: number;
  };
  payments: {
    gunbasiNakit: number;
    bankayaGonderilen: number;
    ertesiGuneBirakilan: number;
  };
  banknotes?: {
    dolum: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
    kart: {
      b200: number;
      b100: number;
      b50: number;
      b20: number;
      b10: number;
      b5: number;
      c1: number;
      c050: number;
    };
  };
  bankSentCash?: {
    dolum: number;
    kart: number;
  };
}

export const bayiDolumService = {
  // Sorumluya teslim et
  submit: async (data: BayiDolumSubmitData) => {
    const response = await apiClient.post('/bayi-dolum/submit', data);
    return response.data;
  },

  // Teslim edilen kayıtları listele
  getSubmitted: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await apiClient.get('/bayi-dolum/submitted', { params });
    return response.data;
  },

  // Tek kayıt detayı
  getById: async (id: string) => {
    const response = await apiClient.get(`/bayi-dolum/submitted/${id}`);
    return response.data;
  },

  // Onayla/Reddet/Revize
  review: async (id: string, action: 'approve' | 'reject' | 'revise', notes?: string) => {
    const response = await apiClient.patch(`/bayi-dolum/submitted/${id}/review`, { action, notes });
    return response.data;
  },

  // Kayıt güncelle (revize edilmiş kaydı tekrar gönder)
  update: async (id: string, data: BayiDolumSubmitData) => {
    const response = await apiClient.put(`/bayi-dolum/submitted/${id}`, data);
    return response.data;
  }
};
