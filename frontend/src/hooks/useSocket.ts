import { useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { useSocketStore } from '../store/socketStore';
import type { Isopod, GameState } from '../types';
import toast from 'react-hot-toast';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function useSocket() {
  const { token, isAuthenticated } = useAuthStore();
  const { setSocket, setConnected, socket } = useSocketStore();
  const { updateIsopod, setGameState, addIdleEarnings, addIsopod } = useGameStore();

  const connect = useCallback(() => {
    if (!token || !isAuthenticated) return;

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      setConnected(true);
      console.log('Socket connected:', newSocket.id);
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
      console.log('Socket disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
      setConnected(false);
    });

    // Isopod updates from server
    newSocket.on('isopod:update', (isopod: Isopod) => {
      updateIsopod(isopod._id, isopod);
      if (!isopod.isAlive) {
        toast.error(`💀 ${isopod.name}이(가) 사망했습니다!`, { duration: 5000 });
      }
    });

    // Breeding complete
    newSocket.on('breeding:complete', (data: { sessionId: string; offspring: Isopod[] }) => {
      data.offspring.forEach((iso) => addIsopod(iso));
      toast.success(
        `🥚 번식 완료! ${data.offspring.length}마리의 새끼가 태어났습니다!`,
        { duration: 5000 }
      );
    });

    // Game state updates
    newSocket.on('game:state', (state: GameState) => {
      setGameState(state);
    });

    // Idle earnings tick
    newSocket.on('game:idle-tick', (data: { coins: number }) => {
      addIdleEarnings(data.coins);
    });

    // Ranking changes
    newSocket.on('ranking:update', () => {
      // Trigger ranking refresh - handled by individual pages
    });

    // Achievement unlocked
    newSocket.on('achievement:unlocked', (achievement: string) => {
      toast.success(`🏆 업적 달성: ${achievement}`, { duration: 6000 });
    });

    setSocket(newSocket);
    return newSocket;
  }, [token, isAuthenticated, setSocket, setConnected, updateIsopod, setGameState, addIdleEarnings, addIsopod]);

  useEffect(() => {
    if (isAuthenticated && token && !socket) {
      connect();
    }

    return () => {
      if (socket && !isAuthenticated) {
        socket.disconnect();
        setSocket(null);
        setConnected(false);
      }
    };
  }, [isAuthenticated, token, socket, connect, setSocket, setConnected]);

  return { socket, connect };
}
