import apiClient from './api';

export interface DeskSubmitData {
  date: string;
  products: {
    dolum: number;
    tamKart: number;
    indirimliKart: number;
    serbestKart: number;
    serbestVize: number;
    indirimliVize: number;
    kartKilifi: number;
  };
  categoryCreditCards: {
    dolum: number;
    kart: number;
    vize: number;
    kartKilifi: number;
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
    vize: {
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
    vize: number;
  };
}

export const deskService = {
  // Sorumluya teslim et
  submit: async (data: DeskSubmitData) => {
    const response = await apiClient.post('/desk/submit', data);
    return response.data;
  },

  // Teslim edilen kayıtları listele
  getSubmitted: async (params?: { startDate?: string; endDate?: string; status?: string }) => {
    const response = await apiClient.get('/desk/submitted', { params });
    return response.data;
  },

  // Tek kayıt detayı
  getById: async (id: string) => {
    const response = await apiClient.get(`/desk/submitted/${id}`);
    return response.data;
  },

  // Onayla/Reddet/Revize
  review: async (id: string, action: 'approve' | 'reject' | 'revise', notes?: string) => {
    const response = await apiClient.patch(`/desk/submitted/${id}/review`, { action, notes });
    return response.data;
  },

  // Kaydı güncelle (revize edilmiş kayıtlar için)
  update: async (id: string, data: DeskSubmitData) => {
    const response = await apiClient.put(`/desk/submitted/${id}`, data);
    return response.data;
  }
};
