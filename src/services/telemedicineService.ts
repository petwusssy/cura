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
  secondary_link?: string;
  created_at: string;
}

export const telemedicineService = {
  getRequests: async (): Promise<TelemedicineRequest[]> => {
    try {
      const response = await api.get('/telemedicine/');
      if (Array.isArray(response.data)) {
        try { localStorage.setItem('cura_telemedicine_requests_cache', JSON.stringify(response.data)); } catch {}
        return response.data;
      }
      return [];
    } catch (error) {
      console.warn('Network issue fetching telemedicine requests, using cached data if available.');
      try {
        const cached = localStorage.getItem('cura_telemedicine_requests_cache');
        if (cached) return JSON.parse(cached);
      } catch {}
      return [];
    }
  },

  approveRequest: async (
    id: string, 
    data: { scheduled_date: string; scheduled_time: string; meeting_link: string; secondary_link?: string; status: 'Approved' | 'Rejected' }
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
  },

  getAvailability: async (): Promise<{ unavailable_dates: string[]; unavailable_times: string[] }> => {
    try {
      const response = await api.get('/telemedicine/availability/');
      return {
        unavailable_dates: response.data?.unavailable_dates || [],
        unavailable_times: response.data?.unavailable_times || [],
      };
    } catch (error) {
      console.error('Failed to fetch telemedicine availability:', error);
      return { unavailable_dates: [], unavailable_times: [] };
    }
  },

  saveAvailability: async (unavailable_dates: string[], unavailable_times: string[] = []): Promise<boolean> => {
    try {
      await api.post('/telemedicine/availability/', { unavailable_dates, unavailable_times });
      return true;
    } catch (error) {
      console.error('Failed to save telemedicine availability:', error);
      return false;
    }
  }
};


