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
};
