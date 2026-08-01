import api from './api';
import { Bed } from '@/types';

export const bedService = {
  getBeds: async (): Promise<Bed[]> => {
    const response = await api.get<Bed[]>('/beds/');
    return response.data;
  },

  updateBed: async (id: string, data: Partial<Bed>): Promise<Bed> => {
    const response = await api.put<Bed>(`/beds/${id}/`, data);
    return response.data;
  },
};
