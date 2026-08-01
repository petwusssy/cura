import api from './api';
import { Patient } from '@/types';

export const patientService = {
  getPatients: async (): Promise<Patient[]> => {
    const response = await api.get<Patient[]>('/patients/');
    return response.data;
  },
  
  getPatientById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}/`);
    return response.data;
  },
  
  createPatient: async (data: Patient): Promise<Patient> => {
    const response = await api.post<Patient>('/patients/', data);
    return response.data;
  },

  updatePatient: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    const response = await api.put<Patient>(`/patients/${id}/`, data);
    return response.data;
  },
  
  deletePatient: async (id: string): Promise<void> => {
    await api.delete(`/patients/${id}/`);
  }
};
