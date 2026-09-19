import api from './api';
import { AppNotification } from '@/types';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    const response = await api.get<AppNotification[]>('/notifications/');
    return response.data;
  },

  updateNotification: async (id: string, data: Partial<AppNotification>): Promise<AppNotification> => {
    const response = await api.patch<AppNotification>(`/notifications/${id}/`, data);
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark_all_read/');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}/`);
  },

  clearAll: async (): Promise<void> => {
    await api.post('/notifications/clear_all/');
  },
};
