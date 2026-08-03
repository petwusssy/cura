import api from './api';
import { Consultation } from '@/types';

export const consultationService = {
  getConsultations: async (): Promise<Consultation[]> => {
    const response = await api.get<any[]>('/consultations/');
    return response.data.map(c => ({ ...c, patientId: c.patient }));
  },

  getConsultationById: async (id: string): Promise<Consultation> => {
    const response = await api.get<any>(`/consultations/${id}/`);
    return { ...response.data, patientId: response.data.patient };
  },

  createConsultation: async (data: Omit<Consultation, 'id'>): Promise<Consultation> => {
    const { patientId, ...rest } = data;
    const response = await api.post<any>('/consultations/', { ...rest, patient: patientId });
    return { ...response.data, patientId: response.data.patient };
  },

  updateConsultation: async (id: string, data: Partial<Consultation>): Promise<Consultation> => {
    const { patientId, ...rest } = data;
    const payload = patientId ? { ...rest, patient: patientId } : rest;
    const response = await api.patch<any>(`/consultations/${id}/`, payload);
    return { ...response.data, patientId: response.data.patient };
  }
};
