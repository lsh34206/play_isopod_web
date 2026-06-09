import apiClient from './axios';
import type { Isopod } from '../types';

export const isopodsApi = {
  getAll: async (): Promise<Isopod[]> => {
    const response = await apiClient.get('/isopods');
    return response.data;
  },

  getById: async (id: string): Promise<Isopod> => {
    const response = await apiClient.get(`/isopods/${id}`);
    return response.data;
  },

  create: async (data: { name: string; species: string }): Promise<Isopod> => {
    const response = await apiClient.post('/isopods', data);
    return response.data;
  },

  feed: async (id: string): Promise<{ isopod: Isopod; coinsEarned: number }> => {
    const response = await apiClient.post(`/isopods/${id}/feed`);
    return response.data;
  },

  care: async (
    id: string,
    action: 'spray' | 'heat' | 'cool'
  ): Promise<{ isopod: Isopod }> => {
    const response = await apiClient.post(`/isopods/${id}/care`, { action });
    return response.data;
  },

  upgrade: async (id: string): Promise<Isopod> => {
    const response = await apiClient.post(`/isopods/${id}/upgrade`);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/isopods/${id}`);
  },
};
