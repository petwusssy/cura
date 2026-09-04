import api from './api';

export interface AppointmentRequest {
  id: string;
  patient: string; // ID of the patient
  patient_name?: string;
  visit_type: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  scheduled_date?: string;
  scheduled_time?: string;
  created_at: string;
}

export const appointmentService = {
  getRequests: async (): Promise<AppointmentRequest[]> => {
    try {
      const response = await api.get('/appointments/');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch appointment requests:', error);
      return [];
    }
  },

  approveRequest: async (
    id: string, 
    data: { scheduled_date: string; scheduled_time: string; status: 'Approved' | 'Rejected' }
  ): Promise<AppointmentRequest | null> => {
    try {
      const response = await api.patch(`/appointments/${id}/approve/`, data);
      return response.data;
    } catch (error) {
      console.error(`Failed to approve request ${id}:`, error);
      return null;
    }
  }
};
