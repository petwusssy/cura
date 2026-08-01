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
      if (response.data.roles) {
        localStorage.setItem('userRoles', JSON.stringify(response.data.roles));
      }
    }
    return response.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout/');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRoles');
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  getRoles: (): string[] => {
    const roles = localStorage.getItem('userRoles');
    return roles ? JSON.parse(roles) : [];
  }
};
