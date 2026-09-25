import api from './api';

export interface MedicalCertificateRequest {
  id: string;
  patient: string; // Patient ID
  patient_name?: string;
  patient_category?: string;
  patient_email?: string;
  patient_contact?: string;
  patient_course?: string;
  patient_yearLevel?: string;
  purpose: string;
  complaint: string;
  start_date?: string;
  end_date?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  diagnosis?: string;
  recommendations?: string;
  doctor?: string;
  remarks?: string;
  created_at: string;
  updated_at: string;
}

export const medcertRequestService = {
  getRequests: async (): Promise<MedicalCertificateRequest[]> => {
    try {
      const response = await api.get('/medcert-requests/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch medcert requests:', error);
      return [];
    }
  },

  approveRequest: async (
    id: string,
    data: {
      status: 'Approved' | 'Rejected';
      diagnosis?: string;
      recommendations?: string;
      doctor?: string;
      remarks?: string;
    }
  ): Promise<MedicalCertificateRequest | null> => {
    try {
      const response = await api.patch(`/medcert-requests/${id}/approve/`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve medcert request ${id}:`, error);
      return null;
    }
  },

  deleteRequest: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/medcert-requests/${id}/`);
      return true;
    } catch (error) {
      console.error(`Failed to delete medcert request ${id}:`, error);
      return false;
    }
  }
};
