import api from './api';
import { MedicalCertificate } from '@/types';

export const certificateService = {
  getCertificates: async (): Promise<MedicalCertificate[]> => {
    const response = await api.get<any[]>('/certificates/');
    return response.data.map(c => ({ ...c, patientId: c.patient }));
  },

  createCertificate: async (data: Omit<MedicalCertificate, 'id'>): Promise<MedicalCertificate> => {
    const { patientId, ...rest } = data;
    const response = await api.post<any>('/certificates/', { ...rest, patient: patientId });
    return { ...response.data, patientId: response.data.patient };
  },

  updateCertificate: async (id: string, data: Partial<MedicalCertificate>): Promise<MedicalCertificate> => {
    const { patientId, ...rest } = data;
    const payload = patientId ? { ...rest, patient: patientId } : rest;
    const response = await api.put<any>(`/certificates/${id}/`, payload);
    return { ...response.data, patientId: response.data.patient };
  },
};
