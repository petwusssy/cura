import api from './api';
import { AppNotification } from '@/types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await api.get<AppNotification[]>('/notifications/');
    return response.data;
  },

  updateNotification: async (id: string, data: Partial<AppNotification>): Promise<AppNotification> => {
    const response = await api.put<AppNotification>(`/notifications/${id}/`, data);
    return response.data;
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}/`);
  },
};
