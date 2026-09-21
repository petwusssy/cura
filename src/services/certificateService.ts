import api from './api';
import { MedicalCertificate } from '@/types';

// Fields the backend MedicalCertificate model actually has.
// All other fields (patientName, age, sex, statusDesignation, etc.) are
// frontend-only display fields — sending them causes a 400 Bad Request.
const formatDateForBackend = (d?: string) => {
  if (!d) return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  }
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
};

const toBackendPayload = (data: Partial<MedicalCertificate> & { patient?: string }) => {
  let packedNotes = data.notes || '';
  try {
    const extra = {
      patientName: data.patientName,
      examinedDueTo: data.examinedDueTo,
      treatment: data.treatment,
      age: data.age,
      sex: data.sex,
      statusDesignation: data.statusDesignation,
      doctorTitle: data.doctorTitle,
      licenseNo: data.licenseNo,
      ptrNo: data.ptrNo,
      rawNotes: data.notes,
    };
    packedNotes = JSON.stringify(extra);
  } catch {}

  return {
    patient:        data.patient ?? data.patientId,
    date:           formatDateForBackend(data.date),
    purpose:        data.purpose || 'Medical Certificate issuance',
    diagnosis:      data.diagnosis || '',
    recommendation: data.recommendation ?? (data as any).recommendations ?? '',
    doctor:         data.doctor || 'JOHNNY MICHAEL P. MANGULABNAN, MD',
    issuedBy:       data.issuedBy || 'UA CLINIC ADMIN',
    notes:          packedNotes,
  };
};

export const certificateService = {
  getCertificates: async (): Promise<MedicalCertificate[]> => {
    const response = await api.get<any[]>('/certificates/');
    return response.data.map(c => {
      let extra: any = {};
      if (c.notes) {
        try {
          if (typeof c.notes === 'string' && c.notes.startsWith('{') && c.notes.endsWith('}')) {
            extra = JSON.parse(c.notes);
          }
        } catch {}
      }
      return {
        ...c,
        patientId: c.patient,
        patientName: c.patient_name || extra.patientName || c.patientName,
        recommendations: c.recommendation || (c as any).recommendations,
        examinedDueTo: extra.examinedDueTo || c.examinedDueTo,
        treatment: extra.treatment || c.treatment,
        age: extra.age !== undefined ? extra.age : c.age,
        sex: extra.sex || c.sex,
        statusDesignation: extra.statusDesignation || c.statusDesignation,
        doctorTitle: extra.doctorTitle || c.doctorTitle,
        licenseNo: extra.licenseNo || c.licenseNo,
        ptrNo: extra.ptrNo || c.ptrNo,
        notes: extra.rawNotes !== undefined ? extra.rawNotes : c.notes,
      };
    });
  },

  createCertificate: async (data: Omit<MedicalCertificate, 'id'>): Promise<MedicalCertificate> => {
    const response = await api.post<any>('/certificates/', toBackendPayload(data as any));
    return {
      ...response.data,
      patientId: response.data.patient,
      patientName: response.data.patient_name || (data as any).patientName,
      recommendations: response.data.recommendation,
    };
  },

  updateCertificate: async (id: string, data: Partial<MedicalCertificate>): Promise<MedicalCertificate> => {
    const response = await api.put<any>(`/certificates/${id}/`, toBackendPayload(data as any));
    return {
      ...response.data,
      patientId: response.data.patient,
      patientName: response.data.patient_name || (data as any).patientName,
      recommendations: response.data.recommendation,
    };
  },

  deleteCertificate: async (id: string): Promise<void> => {
    await api.delete(`/certificates/${id}/`);
  },
};
