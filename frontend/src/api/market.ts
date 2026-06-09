import apiClient from './axios';
import type { MarketListing } from '../types';

export const marketApi = {
  getListings: async (page = 1, grade?: string): Promise<{ listings: MarketListing[]; total: number; pages: number }> => {
    const params = new URLSearchParams({ page: String(page) });
    if (grade) params.set('grade', grade);
    const response = await apiClient.get(`/market?${params}`);
    return response.data;
  },

  getMyListings: async (): Promise<MarketListing[]> => {
    const response = await apiClient.get('/market/my-listings');
    return response.data;
  },

  list: async (isopodId: string, price: number): Promise<MarketListing> => {
    const response = await apiClient.post('/market/list', { isopodId, price });
    return response.data;
  },

  buy: async (listingId: string): Promise<{ listing: MarketListing; coinsSpent: number }> => {
    const response = await apiClient.post(`/market/${listingId}/buy`);
    return response.data;
  },

  cancel: async (listingId: string): Promise<void> => {
    await apiClient.delete(`/market/${listingId}`);
  },
};
