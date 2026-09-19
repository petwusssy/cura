import { PatientQueue } from '@/features/dashboard/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getHeaders = () => {
  const token = localStorage.getItem('accessToken') || localStorage.getItem('cura_access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const queueService = {
  getQueues: async (): Promise<PatientQueue[] | undefined> => {
    try {
      const res = await fetch(`${API_URL}/queue/`, { headers: getHeaders() });
      if (!res.ok) throw new Error('Failed to fetch queues');
      return await res.json();
    } catch (error) {
      console.error(error);
      return undefined;
    }
  },

  joinQueue: async (patientId: string): Promise<PatientQueue | undefined> => {
    try {
      const res = await fetch(`${API_URL}/queue/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ patient: patientId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to join queue');
      }
      return await res.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  notifyQueue: async (id: string): Promise<PatientQueue | undefined> => {
    try {
      const res = await fetch(`${API_URL}/queue/${id}/notify/`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to notify patient');
      return await res.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  },

  completeQueue: async (id: string): Promise<PatientQueue | undefined> => {
    try {
      const res = await fetch(`${API_URL}/queue/${id}/complete/`, {
        method: 'PATCH',
        headers: getHeaders()
      });
      if (!res.ok) throw new Error('Failed to complete queue');
      return await res.json();
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
};
