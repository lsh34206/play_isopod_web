import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '../store/gameStore';
import { isopodsApi } from '../api/isopods';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export function useIsopods() {
  const { isopods, setIsopods, updateIsopod, addIsopod } = useGameStore();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['isopods'],
    queryFn: isopodsApi.getAll,
    staleTime: 15000,
  });

  useEffect(() => {
    if (query.data) {
      setIsopods(query.data);
    }
  }, [query.data, setIsopods]);

  const feedMutation = useMutation({
    mutationFn: (id: string) => isopodsApi.feed(id),
    onSuccess: (data) => {
      updateIsopod(data.isopod._id, data.isopod);
      if (data.coinsEarned > 0) {
        toast.success(`+${data.coinsEarned} 코인`);
      } else {
        toast.success('먹이를 주었습니다!');
      }
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '먹이주기 실패');
    },
  });

  const careMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'spray' | 'heat' | 'cool' }) =>
      isopodsApi.care(id, action),
    onSuccess: (data) => {
      updateIsopod(data.isopod._id, data.isopod);
      toast.success('케어 완료!');
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '케어 실패');
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: { name: string; species: string }) => isopodsApi.create(data),
    onSuccess: (isopod) => {
      addIsopod(isopod);
      toast.success(`${isopod.name} 추가 완료!`);
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '등각류 추가 실패');
    },
  });

  return {
    isopods: isopods.length > 0 ? isopods : (query.data ?? []),
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    feed: feedMutation.mutate,
    care: careMutation.mutate,
    create: createMutation.mutate,
    isFeeding: feedMutation.isPending,
    isCaring: careMutation.isPending,
    isCreating: createMutation.isPending,
  };
}
