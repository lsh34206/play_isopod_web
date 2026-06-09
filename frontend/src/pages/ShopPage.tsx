import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Coins, Gem, CheckCircle } from 'lucide-react';
import { gameApi } from '../api/game';
import { useGameState } from '../hooks/useGameState';
import { useGameStore } from '../store/gameStore';
import { useQueryClient } from '@tanstack/react-query';
import type { ShopItem } from '../types';
import toast from 'react-hot-toast';

const SHOP_ITEMS: ShopItem[] = [
  { id: 'food_small', name: '먹이 (소)', description: '공벌레에게 줄 먹이 10개', price: 50, currency: 'coins', type: 'food', amount: 10, icon: '🍃' },
  { id: 'food_medium', name: '먹이 (중)', description: '먹이 50개 (10% 할인)', price: 225, currency: 'coins', type: 'food', amount: 50, icon: '🌿' },
  { id: 'food_large', name: '먹이 (대)', description: '먹이 200개 (20% 할인)', price: 800, currency: 'coins', type: 'food', amount: 200, icon: '🌱' },
  { id: 'spray_small', name: '습도 스프레이 (소)', description: '습도를 조절하는 스프레이 5개', price: 30, currency: 'coins', type: 'spray', amount: 5, icon: '💧' },
  { id: 'spray_medium', name: '습도 스프레이 (중)', description: '습도 스프레이 20개', price: 100, currency: 'coins', type: 'spray', amount: 20, icon: '🫧' },
  { id: 'heater_small', name: '미니 히터', description: '온도를 높이는 히터 3개', price: 80, currency: 'coins', type: 'heater', amount: 3, icon: '🔥' },
  { id: 'cooler_small', name: '미니 쿨러', description: '온도를 낮추는 쿨러 3개', price: 80, currency: 'coins', type: 'cooler', amount: 3, icon: '❄️' },
  { id: 'slot_expand', name: '슬롯 확장', description: '공벌레 슬롯 +5 증가', price: 5, currency: 'gems', type: 'slot', amount: 5, icon: '📦' },
  { id: 'gem_small', name: '젬 10개', description: '프리미엄 화폐 10개', price: 1000, currency: 'coins', type: 'gem', amount: 10, icon: '💎' },
];

const CATEGORY_LABELS: Record<string, string> = {
  all: '전체', food: '먹이', spray: '스프레이', heater: '히터', cooler: '쿨러', slot: '슬롯', gem: '젬',
};

function ShopItemCard({ item, onBuy, canAfford, isLoading }: {
  item: ShopItem; onBuy: (item: ShopItem, qty: number) => void; canAfford: boolean; isLoading: boolean;
}) {
  const [qty, setQty] = useState(1);
  const [purchased, setPurchased] = useState(false);
  const totalCost = item.price * qty;

  const handleBuy = () => {
    onBuy(item, qty);
    setPurchased(true);
    setTimeout(() => setPurchased(false), 1500);
  };

  const typeLabel: Record<string, string> = { food: '먹이', spray: '스프레이', heater: '히터', cooler: '쿨러', slot: '슬롯', gem: '젬' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-slate-800 border rounded-2xl p-4 transition-colors ${canAfford ? 'border-slate-700 hover:border-slate-600' : 'border-slate-700/50 opacity-60'}`}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="text-4xl">{item.icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-sm">{item.name}</h3>
          <p className="text-slate-400 text-xs mt-0.5">{item.description}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-emerald-400 text-xs">+{item.amount}</span>
            <span className="text-slate-500 text-xs">{typeLabel[item.type] || item.type}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-colors flex items-center justify-center">-</button>
        <span className="text-white font-mono text-sm w-6 text-center">{qty}</span>
        <button onClick={() => setQty(Math.min(99, qty + 1))} className="w-7 h-7 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm transition-colors flex items-center justify-center">+</button>
        <div className="flex-1" />
        <div className={`flex items-center gap-1 ${item.currency === 'gems' ? 'text-violet-400' : 'text-amber-400'}`}>
          {item.currency === 'gems' ? <Gem size={13} /> : <Coins size={13} />}
          <span className="font-bold text-sm">{totalCost.toLocaleString()}</span>
        </div>
      </div>
      <button
        onClick={handleBuy}
        disabled={!canAfford || isLoading}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl font-semibold text-sm transition-all ${purchased ? 'bg-emerald-700 text-white' : canAfford ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
      >
        {purchased ? (<><CheckCircle size={14} />구매 완료!</>) : (<><ShoppingCart size={14} />{canAfford ? '구매하기' : '재화 부족'}</>)}
      </button>
    </motion.div>
  );
}

export default function ShopPage() {
  const { gameState, refetch } = useGameState();
  const { updateGameState } = useGameStore();
  const queryClient = useQueryClient();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const categories = ['all', 'food', 'spray', 'heater', 'cooler', 'slot', 'gem'];

  const filteredItems = categoryFilter === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((item) => item.type === categoryFilter);

  const handleBuy = async (item: ShopItem, qty: number) => {
    if (!gameState) return;
    const totalCost = item.price * qty;
    if (item.currency === 'coins' && gameState.coins < totalCost) { toast.error('코인이 부족합니다!'); return; }
    if (item.currency === 'gems' && gameState.gems < totalCost) { toast.error('젬이 부족합니다!'); return; }
    setIsPurchasing(true);
    try {
      const result = await gameApi.buyItem(item.id, qty);
      updateGameState(result.gameState);
      toast.success(`${item.name} ${qty}개 구매 완료!`);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || '구매 실패';
      toast.error(message);
    } finally {
      setIsPurchasing(false);
    }
  };

  const canAffordItem = (item: ShopItem) => {
    if (!gameState) return false;
    return item.currency === 'coins' ? gameState.coins >= item.price : gameState.gems >= item.price;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">상점</h1>
        <p className="text-slate-400 text-sm">공벌레 케어에 필요한 아이템을 구매하세요</p>
      </div>
      {gameState && (
        <div className="flex gap-4 flex-wrap">
          <div className="flex items-center gap-2 bg-amber-900/20 border border-amber-700/40 rounded-xl px-4 py-2">
            <Coins size={16} className="text-amber-400" />
            <span className="text-amber-300 font-bold">{gameState.coins.toLocaleString()} 코인</span>
          </div>
          <div className="flex items-center gap-2 bg-violet-900/20 border border-violet-700/40 rounded-xl px-4 py-2">
            <Gem size={16} className="text-violet-400" />
            <span className="text-violet-300 font-bold">{gameState.gems.toLocaleString()} 젬</span>
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${categoryFilter === cat ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredItems.map((item) => (
          <ShopItemCard key={item.id} item={item} onBuy={handleBuy} canAfford={canAffordItem(item)} isLoading={isPurchasing} />
        ))}
      </div>
      <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-2xl p-4">
        <h3 className="text-emerald-300 font-semibold mb-2">💡 코인 획득 방법</h3>
        <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-400">
          <div className="flex items-center gap-2"><span>🐛</span><span>공벌레가 자동으로 코인 생성 (유휴 수익)</span></div>
          <div className="flex items-center gap-2"><span>🍃</span><span>먹이를 주면 추가 경험치 및 코인</span></div>
          <div className="flex items-center gap-2"><span>🏪</span><span>시장에서 공벌레 판매</span></div>
          <div className="flex items-center gap-2"><span>🏆</span><span>업적 달성 시 보상</span></div>
        </div>
      </div>
    </div>
  );
}
