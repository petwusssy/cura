import api from './api';
import { AppNotification } from '@/types';
import { staffService } from './staffService';

export const notificationService = {
  getNotifications: async (): Promise<AppNotification[]> => {
    try {
      const response = await api.get<AppNotification[]>('/notifications/?audience=web');
      return response.data || [];
    } catch {
      return [];
    }
  },

  updateNotification: async (id: string, data: Partial<AppNotification>): Promise<AppNotification> => {
    const response = await api.patch<AppNotification>(`/notifications/${id}/`, data);
    return response.data;
  },

  markAllRead: async (): Promise<void> => {
    await api.post('/notifications/mark_all_read/?audience=web');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}/`);
  },

  clearAll: async (): Promise<void> => {
    const shift = staffService.getActiveShift();
    await api.post('/notifications/clear_all/?audience=web', {
      staff_id: shift?.staff?.id || undefined,
      staff_name: shift?.staff?.name || localStorage.getItem('username') || 'Clinic Staff',
      staff_role: shift?.staff?.role || 'Clinic Staff',
    });
  },
};
