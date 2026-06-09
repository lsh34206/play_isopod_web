import apiClient from './axios';
import type { MarketListing, Isopod } from '../types';

export const marketApi = {
  getListings: async (
    page = 1,
    limit = 20
  ): Promise<{ listings: MarketListing[]; total: number; pages: number }> => {
    const response = await apiClient.get('/market/listings', { params: { page, limit } });
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

  buy: async (listingId: string): Promise<{ listing: MarketListing; isopod: Isopod; coinsSpent: number }> => {
    const response = await apiClient.post(`/market/buy/${listingId}`);
    return response.data;
  },

  cancel: async (listingId: string): Promise<void> => {
    await apiClient.delete(`/market/cancel/${listingId}`);
  },
};
