import apiClient from './axios';
import type { BreedingSession } from '../types';

export const breedingApi = {
  start: async (
    parent1Id: string,
    parent2Id: string
  ): Promise<BreedingSession> => {
    const response = await apiClient.post('/breeding/start', {
      parent1Id,
      parent2Id,
    });
    return response.data;
  },

  getActive: async (): Promise<BreedingSession[]> => {
    const response = await apiClient.get('/breeding/active');
    return response.data;
  },

  collect: async (sessionId: string): Promise<BreedingSession> => {
    const response = await apiClient.post(`/breeding/${sessionId}/collect`);
    return response.data;
  },

  getHistory: async (): Promise<BreedingSession[]> => {
    const response = await apiClient.get('/breeding/history');
    return response.data;
  },
};
