import { useQuery } from '@tanstack/react-query';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/game';
import { useEffect } from 'react';

export function useGameState() {
  const { gameState, setGameState } = useGameStore();

  const query = useQuery({
    queryKey: ['gameState'],
    queryFn: gameApi.getState,
    refetchInterval: 30000, // Refetch every 30s as fallback
    staleTime: 10000,
  });

  useEffect(() => {
    if (query.data) {
      setGameState(query.data);
    }
  }, [query.data, setGameState]);

  return {
    gameState: gameState ?? query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
