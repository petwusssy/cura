import api from './api';
import { MedicalCertificate } from '@/types';

// Fields the backend MedicalCertificate model actually has.
// All other fields (patientName, age, sex, statusDesignation, etc.) are
// frontend-only display fields — sending them causes a 400 Bad Request.
const formatDateForBackend = (d?: string) => {
  if (!d) return new Date().toISOString().split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  return new Date().toISOString().split('T')[0];
};

const toBackendPayload = (data: Partial<MedicalCertificate> & { patient?: string }) => ({
  patient:        data.patient ?? data.patientId,
  date:           formatDateForBackend(data.date),
  purpose:        data.purpose || 'Medical Certificate issuance',
  diagnosis:      data.diagnosis || '',
  recommendation: data.recommendation ?? (data as any).recommendations ?? '',
  doctor:         data.doctor || 'JOHNNY MICHAEL P. MANGULABNAN, MD',
  issuedBy:       data.issuedBy || 'UA CLINIC ADMIN',
  notes:          data.notes || '',
});

export const certificateService = {
  getCertificates: async (): Promise<MedicalCertificate[]> => {
    const response = await api.get<any[]>('/certificates/');
    return response.data.map(c => ({
      ...c,
      patientId: c.patient,
      recommendations: c.recommendation || (c as any).recommendations,
    }));
  },

  createCertificate: async (data: Omit<MedicalCertificate, 'id'>): Promise<MedicalCertificate> => {
    const response = await api.post<any>('/certificates/', toBackendPayload(data as any));
    return {
      ...response.data,
      patientId: response.data.patient,
      recommendations: response.data.recommendation,
    };
  },

  updateCertificate: async (id: string, data: Partial<MedicalCertificate>): Promise<MedicalCertificate> => {
    const response = await api.put<any>(`/certificates/${id}/`, toBackendPayload(data as any));
    return {
      ...response.data,
      patientId: response.data.patient,
      recommendations: response.data.recommendation,
    };
  },
};
