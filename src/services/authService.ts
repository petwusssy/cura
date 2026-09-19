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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('cura_access_token');
    localStorage.removeItem('userRoles');
    localStorage.removeItem('username');
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
