import api from './api';

export interface LoginResponse {
  access: string;
  roles?: string[];
  username?: string;
}

export const authService = {
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('accessToken', response.data.access);
      localStorage.setItem('cura_access_token', response.data.access);
      if (response.data.roles) {
        localStorage.setItem('userRoles', JSON.stringify(response.data.roles));
      }
      if (response.data.username) {
        localStorage.setItem('username', response.data.username);
      }
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout/');
    } catch {
      // ignore network errors on logout
    }
    const keysToRemove = [
      'accessToken',
      'cura_access_token',
      'userRoles',
      'username',
      'cura_patients_cache',
      'cura_consultations_cache',
      'cura_medicines_cache',
      'cura_purchase_requests',
      'cura_purchase_requests_cache',
      'cura_appointment_requests_cache',
      'cura_telemedicine_requests_cache',
      'cura_medcert_requests_cache',
      'cura_medical_certs',
      'cura_beds_cache',
      'cura_queues_cache',
      'cura_audit_logs_cache',
      'cura_clinic_staff_cache',
      'cura_clinic_staff_pins',
      'cura_intaked_med_doses',
      'cura_read_notifs',
    ];
    keysToRemove.forEach((k) => {
      try { localStorage.removeItem(k); } catch { }
    });
    try {
      sessionStorage.removeItem('cura_active_staff_shift');
    } catch { }
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('accessToken');
  },

  getUsername: (): string => {
    return localStorage.getItem('username') || '';
  },

  getRoles: (): string[] => {
    const roles = localStorage.getItem('userRoles');
    return roles ? JSON.parse(roles) : [];
  }
};
