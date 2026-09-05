import api from './api';

export interface TelemedicineRequest {
  id: string;
  patient: string; // ID of the patient
  patient_name?: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  scheduled_date?: string;
  scheduled_time?: string;
  meeting_link?: string;
  created_at: string;
}

export const telemedicineService = {
  getRequests: async (): Promise<TelemedicineRequest[]> => {
    try {
      const response = await api.get('/telemedicine/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch telemedicine requests:', error);
      return [];
    }
  },

  approveRequest: async (
    id: string, 
    data: { scheduled_date: string; scheduled_time: string; meeting_link: string; status: 'Approved' | 'Rejected' }
  ): Promise<TelemedicineRequest | null> => {
    try {
      const response = await api.patch(`/telemedicine/${id}/approve/`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve request ${id}:`, error);
      return null;
    }
  },

  deleteRequest: async (id: string): Promise<boolean> => {
    try {
      await api.delete(`/telemedicine/${id}/`);
      return true;
    } catch (error) {
      console.error(`Failed to delete request ${id}:`, error);
      return false;
    }
  }
};
