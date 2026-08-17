import api from './api';
import { MedicalCertificate } from '@/types';

// Fields the backend MedicalCertificate model actually has.
// All other fields (patientName, age, sex, statusDesignation, etc.) are
// frontend-only display fields — sending them causes a 400 Bad Request.
const toBackendPayload = (data: Partial<MedicalCertificate> & { patient?: string }) => ({
  patient:        data.patient ?? data.patientId,
  date:           data.date,
  purpose:        data.purpose,
  diagnosis:      data.diagnosis,
  recommendation: data.recommendation,
  doctor:         data.doctor,
  issuedBy:       data.issuedBy,
});

export const certificateService = {
  getCertificates: async (): Promise<MedicalCertificate[]> => {
    const response = await api.get<any[]>('/certificates/');
    return response.data.map(c => ({ ...c, patientId: c.patient }));
  },

  createCertificate: async (data: Omit<MedicalCertificate, 'id'>): Promise<MedicalCertificate> => {
    const response = await api.post<any>('/certificates/', toBackendPayload(data as any));
    return { ...response.data, patientId: response.data.patient };
  },

  updateCertificate: async (id: string, data: Partial<MedicalCertificate>): Promise<MedicalCertificate> => {
    const response = await api.put<any>(`/certificates/${id}/`, toBackendPayload(data as any));
    return { ...response.data, patientId: response.data.patient };
  },
};
