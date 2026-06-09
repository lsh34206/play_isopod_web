import apiClient from './axios';
import type { GameState } from '../types';

export const gameApi = {
  getState: async (): Promise<GameState> => {
    const response = await apiClient.get('/game/state');
    return response.data;
  },

  collectIdle: async (): Promise<{ coins: number; gameState: GameState }> => {
    const response = await apiClient.post('/game/collect-idle');
    return response.data;
  },

  buyItem: async (
    itemType: string,
    quantity: number
  ): Promise<{ gameState: GameState; cost: number }> => {
    const response = await apiClient.post('/game/shop/buy', { itemType, quantity });
    return response.data;
  },

  getDailyReward: async (): Promise<{ reward: number; streak: number; gameState: GameState }> => {
    const response = await apiClient.post('/game/daily-reward');
    return response.data;
  },

  getAchievements: async (): Promise<string[]> => {
    const response = await apiClient.get('/game/achievements');
    return response.data;
  },
};
