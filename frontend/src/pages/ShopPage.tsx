import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Coins, Gem, Package, Droplets, Thermometer, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { gameApi } from '../api/game';
import { useGameStore } from '../store/gameStore';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'coins' | 'gems';
  type: 'food' | 'spray' | 'heater' | 'cooler' | 'slot';
  amount: number;
  icon: string;
  color: string;
}

const SHOP_ITEMS: ShopItem[] = [
  {
    id: 'food-10',
    name: '먹이 10개',
    description: '공벌레에게 먹이를 줄 수 있습니다. 배고픔 +30',
    price: 50,
    currency: 'coins',
    type: 'food',
    amount: 10,
    icon: '🍂',
    color: 'border-amber-700',
  },
  {
    id: 'food-50',
    name: '먹이 50개',
    description: '대량 구매 할인! 배고픔 +30',
    price: 200,
    currency: 'coins',
    type: 'food',
    amount: 50,
    icon: '🍃',
    color: 'border-amber-700',
  },
  {
    id: 'food-200',
    name: '먹이 200개',
    description: '초대량 패키지! 배고픔 +30',
    price: 700,
    currency: 'coins',
    type: 'food',
    amount: 200,
    icon: '🌿',
    color: 'border-amber-700',
  },
  {
    id: 'spray-5',
    name: '습도 스프레이 5개',
    description: '습도를 조절합니다. 습도 +10',
    price: 80,
    currency: 'coins',
    type: 'spray',
    amount: 5,
    icon: '💧',
    color: 'border-blue-700',
  },
  {
    id: 'spray-20',
    name: '습도 스프레이 20개',
    description: '습도를 조절합니다. 습도 +10',
    price: 280,
    currency: 'coins',
    type: 'spray',
    amount: 20,
    icon: '🌊',
    color: 'border-blue-700',
  },
  {
    id: 'heater-3',
    name: '히터 3개',
    description: '온도를 높입니다. 온도 +2°C',
    price: 120,
    currency: 'coins',
    type: 'heater',
    amount: 3,
    icon: '🔥',
    color: 'border-red-700',
  },
  {
    id: 'cooler-3',
    name: '쿨러 3개',
    description: '온도를 낮춥니다. 온도 -2°C',
    price: 120,
    currency: 'coins',
    type: 'cooler',
    amount: 3,
    icon: '❄️',
    color: 'border-cyan-700',
  },
  {
    id: 'slot-1',
    name: '사육 슬롯 +1',
    description: '공벌레를 한 마리 더 키울 수 있습니다',
    price: 500,
    currency: 'coins',
    type: 'slot',
    amount: 1,
    icon: '🏠',
    color: 'border-purple-700',
  },
];

export default function ShopPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { gameState, setGameState } = useGameStore();
  const qc = useQueryClient();

  useQuery({
    queryKey: ['game-state'],
    queryFn: async () => {
      const data = await gameApi.getState();
      setGameState(data);
      return data;
    },
  });

  const buyMutation = useMutation({
    mutationFn: ({ itemType, quantity }: { itemType: string; quantity: number }) =>
      gameApi.buyItem(itemType, quantity),
    onSuccess: (data) => {
      setGameState(data.gameState);
      toast.success(`구매 완료! ${data.cost.toLocaleString()} 코인 사용`);
      qc.invalidateQueries({ queryKey: ['game-state'] });
    },
    onError: () => toast.error('구매 실패. 코인이 부족합니다.'),
  });

  const handleBuy = (item: ShopItem) => {
    const qty = quantities[item.id] || 1;
    buyMutation.mutate({ itemType: item.type, quantity: qty * item.amount });
  };

  const totalCost = (item: ShopItem) => {
    const qty = quantities[item.id] || 1;
    return item.price * qty;
  };

  const canAfford = (item: ShopItem) => {
    if (!gameState) return false;
    if (item.currency === 'coins') return gameState.coins >= totalCost(item);
    return gameState.gems >= totalCost(item);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShoppingCart className="w-6 h-6 text-amber-400" />
          <h1 className="text-xl font-bold">상점</h1>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-bold">{gameState?.coins.toLocaleString() ?? 0}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-lg">
            <Gem className="w-4 h-4 text-violet-400" />
            <span className="text-violet-400 font-bold">{gameState?.gems.toLocaleString() ?? 0}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SHOP_ITEMS.map((item) => (
          <div
            key={item.id}
            className={`bg-slate-900 border ${item.color} rounded-xl p-4 flex flex-col gap-3`}
          >
            <div className="flex items-start gap-3">
              <span className="text-3xl">{item.icon}</span>
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-slate-400">{item.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantities((q) => ({ ...q, [item.id]: Math.max(1, (q[item.id] || 1) - 1) }))}
                className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm font-bold"
              >
                -
              </button>
              <span className="text-sm font-bold w-8 text-center">{quantities[item.id] || 1}</span>
              <button
                onClick={() => setQuantities((q) => ({ ...q, [item.id]: (q[item.id] || 1) + 1 }))}
                className="w-7 h-7 rounded bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-sm font-bold"
              >
                +
              </button>
            </div>

            <button
              onClick={() => handleBuy(item)}
              disabled={!canAfford(item) || buyMutation.isPending}
              className="w-full py-2 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                bg-amber-600 hover:bg-amber-500 text-white"
            >
              <span className="flex items-center justify-center gap-1.5">
                {item.currency === 'coins' ? (
                  <Coins className="w-3.5 h-3.5" />
                ) : (
                  <Gem className="w-3.5 h-3.5" />
                )}
                {totalCost(item).toLocaleString()}
              </span>
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-amber-400" />
          보유 아이템
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">🍃</p>
            <p className="text-xs text-slate-400">먹이</p>
            <p className="text-lg font-bold text-amber-400">{gameState?.feedStock ?? 0}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">💧</p>
            <p className="text-xs text-slate-400">습도 스프레이</p>
            <p className="text-lg font-bold text-blue-400">{gameState?.moistureSpray ?? 0}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">🔥</p>
            <p className="text-xs text-slate-400">히터</p>
            <p className="text-lg font-bold text-red-400">{gameState?.heaterCount ?? 0}</p>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-center">
            <p className="text-2xl mb-1">❄️</p>
            <p className="text-xs text-slate-400">쿨러</p>
            <p className="text-lg font-bold text-cyan-400">{gameState?.coolerCount ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-700 rounded-xl p-5">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-400" />
          슬롯 정보
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-slate-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{
                width: gameState ? `${(gameState.totalIsopods / gameState.maxIsopods) * 100}%` : '0%',
              }}
            />
          </div>
          <span className="text-sm text-slate-300 whitespace-nowrap">
            {gameState?.totalIsopods ?? 0} / {gameState?.maxIsopods ?? 5} 마리
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2">슬롯 확장: 1회당 500 코인</p>
      </div>
    </div>
  );
}
