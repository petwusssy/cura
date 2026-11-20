import api from './api';
import { MedicineItem, PurchaseRequest } from '@/types';

export const medicineService = {
  getMedicines: async (): Promise<MedicineItem[]> => {
    const response = await api.get<MedicineItem[]>('/medicines/');
    return response.data.map(m => ({
      ...m,
      dateAdded: m.dateAdded ? m.dateAdded.split(/[T\s]/)[0] : m.dateAdded,
    }));
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
  updateStock: async (
    id: string,
    quantity: number,
    type: 'add' | 'dispense' = 'dispense',
    note?: string,
    date?: string,
    options?: { expirationDate?: string; batchNumber?: string }
  ): Promise<MedicineItem> => {
    const response = await api.patch<MedicineItem>(`/medicines/${id}/stock/`, {
      qty: quantity,
      quantity,
      type,
      note,
      date,
      expirationDate: options?.expirationDate,
      batchNumber: options?.batchNumber,
    });
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
  },

  deletePurchaseRequest: async (id: string): Promise<void> => {
    await api.delete(`/purchase-requests/${id}/`);
  },

  receivePurchaseDelivery: async (
    id: string,
    payload: { qty: number; date?: string; note?: string; expirationDate?: string; batchNumber?: string }
  ): Promise<{ request: PurchaseRequest; medicine: MedicineItem | null }> => {
    const response = await api.post<{ request: PurchaseRequest; medicine: MedicineItem | null }>(
      `/purchase-requests/${id}/receive/`,
      payload
    );
    return response.data;
  },

  voidPurchaseRequisitionForm: async (payload: {
    prfNo?: string;
    ids?: string[];
    reason?: string;
    staffName?: string;
  }): Promise<PurchaseRequest[]> => {
    const response = await api.post<PurchaseRequest[]>('/purchase-requests/void-prf/', {
      prfNo: payload.prfNo,
      ids: payload.ids,
      reason: payload.reason,
      staff_name: payload.staffName,
    });
    return response.data;
  },
};
