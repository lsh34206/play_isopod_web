import apiClient from './axios';
import type { AuthResponse, User } from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (
    username: string,
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', {
      username,
      email,
      password,
    });
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },
};
