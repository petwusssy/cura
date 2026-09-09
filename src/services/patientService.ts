import api from './api';
import { Patient } from '@/types';

export const patientService = {
  getPatients: async (): Promise<Patient[]> => {
    const response = await api.get<Patient[]>('/patients/');
    return response.data.map(p => ({
      ...p,
      name: p.name ? p.name.toUpperCase() : p.name,
    }));
  },
  
  getPatientById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}/`);
    const p = response.data;
    return { ...p, name: p.name ? p.name.toUpperCase() : p.name };
  },
  
  createPatient: async (data: Patient): Promise<Patient> => {
    const payload = { ...data, name: data.name ? data.name.trim().toUpperCase() : data.name };
    const response = await api.post<Patient>('/patients/', payload);
    const p = response.data;
    return { ...p, name: p.name ? p.name.toUpperCase() : p.name };
  },

  updatePatient: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const payload = { ...data, ...(data.name ? { name: data.name.trim().toUpperCase() } : {}) };
    const response = await api.put<Patient>(`/patients/${id}/`, payload);
    const p = response.data;
    return { ...p, name: p.name ? p.name.toUpperCase() : p.name };
  },
  
  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}/`);
  }
};
