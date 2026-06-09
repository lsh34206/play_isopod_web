import { create } from 'zustand';
import type { GameState, Isopod } from '../types';

interface GameStore {
  gameState: GameState | null;
  isopods: Isopod[];
  idleEarnings: number;
  setGameState: (state: GameState) => void;
  updateGameState: (partial: Partial<GameState>) => void;
  addCoins: (amount: number) => void;
  spendCoins: (amount: number) => boolean;
  addGems: (amount: number) => void;
  setIsopods: (isopods: Isopod[]) => void;
  updateIsopod: (id: string, partial: Partial<Isopod>) => void;
  addIsopod: (isopod: Isopod) => void;
  removeIsopod: (id: string) => void;
  addIdleEarnings: (amount: number) => void;
  resetIdleEarnings: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  isopods: [],
  idleEarnings: 0,

  setGameState: (state) => set({ gameState: state }),

  updateGameState: (partial) =>
    set((s) => ({
      gameState: s.gameState ? { ...s.gameState, ...partial } : null,
    })),

  addCoins: (amount) =>
    set((s) => ({
      gameState: s.gameState
        ? { ...s.gameState, coins: s.gameState.coins + amount }
        : null,
    })),

  spendCoins: (amount) => {
    const { gameState } = get();
    if (!gameState || gameState.coins < amount) return false;
    set((s) => ({
      gameState: s.gameState
        ? { ...s.gameState, coins: s.gameState.coins - amount }
        : null,
    }));
    return true;
  },

  addGems: (amount) =>
    set((s) => ({
      gameState: s.gameState
        ? { ...s.gameState, gems: s.gameState.gems + amount }
        : null,
    })),

  setIsopods: (isopods) => set({ isopods }),

  updateIsopod: (id, partial) =>
    set((s) => ({
      isopods: s.isopods.map((iso) =>
        iso._id === id ? { ...iso, ...partial } : iso
      ),
    })),

  addIsopod: (isopod) =>
    set((s) => ({ isopods: [...s.isopods, isopod] })),

  removeIsopod: (id) =>
    set((s) => ({ isopods: s.isopods.filter((iso) => iso._id !== id) })),

  addIdleEarnings: (amount) =>
    set((s) => ({ idleEarnings: s.idleEarnings + amount })),

  resetIdleEarnings: () => set({ idleEarnings: 0 }),
}));
