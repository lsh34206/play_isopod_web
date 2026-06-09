import apiClient from './axios';
import type { RankingEntry } from '../types';

export const rankingApi = {
  getTop: async (limit = 100): Promise<RankingEntry[]> => {
    const response = await apiClient.get(`/ranking?limit=${limit}`);
    return response.data;
  },

  getMyRank: async (): Promise<RankingEntry | null> => {
    try {
      const response = await apiClient.get('/ranking/me');
      return response.data;
    } catch {
      return null;
    }
  },
};
