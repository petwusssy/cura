import api from './api';
import { MedicineItem, PurchaseRequest } from '@/types';

export const medicineService = {
  getMedicines: async (): Promise<MedicineItem[]> => {
    const response = await api.get<MedicineItem[]>('/medicines/');
    return response.data;
  },

  getMedicineById: async (id: string): Promise<MedicineItem> => {
    const response = await api.get<MedicineItem>(`/medicines/${id}/`);
    return response.data;
  },

  createMedicine: async (data: Omit<MedicineItem, 'id'>): Promise<MedicineItem> => {
    const response = await api.post<MedicineItem>('/medicines/', data);
    return response.data;
  },

  updateMedicine: async (id: string, data: Partial<MedicineItem>): Promise<MedicineItem> => {
    const response = await api.put<MedicineItem>(`/medicines/${id}/`, data);
    return response.data;
  },
  updateStock: async (id: string, quantity: number): Promise<MedicineItem> => {
    const response = await api.patch<MedicineItem>(`/medicines/${id}/stock/`, { quantity });
    return response.data;
  },

  getPurchaseRequests: async (): Promise<PurchaseRequest[]> => {
    const response = await api.get<PurchaseRequest[]>('/purchase-requests/');
    return response.data;
  },

  createPurchaseRequest: async (data: Omit<PurchaseRequest, 'id'>): Promise<PurchaseRequest> => {
    const response = await api.post<PurchaseRequest>('/purchase-requests/', data);
    return response.data;
  },

  updatePurchaseRequest: async (id: string, data: Partial<PurchaseRequest>): Promise<PurchaseRequest> => {
    const response = await api.put<PurchaseRequest>(`/purchase-requests/${id}/`, data);
    return response.data;
  }
};
