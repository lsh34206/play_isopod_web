import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw, Coins, Zap, Bug } from 'lucide-react';
import IsopodCard from '../components/IsopodCard';
import IsopodDetails from '../components/IsopodDetails';
import { useIsopods } from '../hooks/useIsopods';
import { useGameState } from '../hooks/useGameState';
import { useGameStore } from '../store/gameStore';
import { gameApi } from '../api/game';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Isopod } from '../types';

const SPECIES_OPTIONS = [
  { value: 'armadillidium', label: '공벌레', emoji: '🔵' },
  { value: 'porcellio', label: '쥐며느리', emoji: '🐛' },
  { value: 'cubaris', label: '큐바리스', emoji: '🟤' },
];

function AddIsopodModal({ onClose, onAdd }: { onClose: () => void; onAdd: (name: string, species: string) => void }) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('armadillidium');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsLoading(true);
    try {
      await onAdd(name.trim(), species);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-sm"
      >
        <h2 className="text-white font-bold text-xl mb-5">새 공벌레 추가</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">이름</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="공벌레 이름을 지어주세요"
              className="w-full bg-slate-700 border border-slate-600 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
              maxLength={20}
              autoFocus
            />
          </div>
          <div>
            <label className="text-slate-400 text-sm mb-1.5 block">종류</label>
            <div className="grid grid-cols-3 gap-2">
              {SPECIES_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSpecies(opt.value)}
                  className={`p-3 rounded-xl border text-center transition-all ${
                    species === opt.value
                      ? 'border-amber-500 bg-amber-600/20 text-amber-300'
                      : 'border-slate-600 text-slate-400 hover:border-slate-500'
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.emoji}</div>
                  <div className="text-xs">{opt.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:border-slate-500 text-sm transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-amber-800 text-white font-semibold text-sm transition-colors"
            >
              {isLoading ? '추가 중...' : '추가하기'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { isopods, isLoading, refetch, feed, care, create } = useIsopods();
  const { gameState } = useGameState();
  const { idleEarnings, addCoins, updateGameState } = useGameStore();
  const queryClient = useQueryClient();
  const [selectedIsopod, setSelectedIsopod] = useState<Isopod | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'alive' | 'dead'>('all');

  // Tick idle earnings display
  useEffect(() => {
    const aliveCount = isopods.filter((i) => i.isAlive).length;
    if (aliveCount === 0) return;
    const interval = setInterval(() => {
      addCoins(aliveCount * 0.1); // visual only, server-authoritative
    }, 1000);
    return () => clearInterval(interval);
  }, [isopods, addCoins]);

  const handleCollectIdle = async () => {
    if (isCollecting) return;
    setIsCollecting(true);
    try {
      const result = await gameApi.collectIdle();
      updateGameState({ coins: result.gameState.coins });
      toast.success(`+${result.coins.toLocaleString()} 코인 수집!`);
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    } catch {
      toast.error('수집 실패');
    } finally {
      setIsCollecting(false);
    }
  };

  const filteredIsopods = isopods.filter((iso) => {
    if (filter === 'alive') return iso.isAlive;
    if (filter === 'dead') return !iso.isAlive;
    return true;
  });

  const aliveCount = isopods.filter((i) => i.isAlive).length;
  const deadCount = isopods.filter((i) => !i.isAlive).length;

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-800 border border-slate-700 rounded-2xl p-4"
        >
          <div className="text-slate-400 text-xs mb-1">총 공벌레</div>
          <div className="text-2xl font-black text-white">
            {gameState?.totalIsopods ?? 0}
            <span className="text-slate-500 text-sm font-normal">/{gameState?.maxIsopods ?? 10}</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">{aliveCount} 살아있음</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-slate-800 border border-amber-700/40 rounded-2xl p-4"
        >
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Coins size={10} className="text-amber-400" />
            코인
          </div>
          <div className="text-2xl font-black text-amber-300">
            {(gameState?.coins ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-amber-600 mt-1">+{aliveCount} /초 (유휴)</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-800 border border-violet-700/40 rounded-2xl p-4"
        >
          <div className="text-slate-400 text-xs mb-1">💎 젬</div>
          <div className="text-2xl font-black text-violet-300">
            {(gameState?.gems ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-slate-500 mt-1">프리미엄 재화</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-slate-800 border border-emerald-700/40 rounded-2xl p-4"
        >
          <div className="text-slate-400 text-xs mb-1 flex items-center gap-1">
            <Zap size={10} className="text-emerald-400" />
            유휴 수익
          </div>
          <div className="text-2xl font-black text-emerald-300">
            +{Math.round(idleEarnings).toLocaleString()}
          </div>
          <button
            onClick={handleCollectIdle}
            disabled={isCollecting || idleEarnings < 1}
            className="text-xs bg-emerald-700 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white px-2 py-0.5 rounded-lg mt-1 transition-colors"
          >
            {isCollecting ? '수집 중...' : '수집하기'}
          </button>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(['all', 'alive', 'dead'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                filter === f
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {f === 'all' ? `전체 (${isopods.length})` : f === 'alive' ? `생존 (${aliveCount})` : `사망 (${deadCount})`}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            title="새로고침"
          >
            <RefreshCw size={15} />
          </button>
          {gameState && gameState.totalIsopods < gameState.maxIsopods && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors"
            >
              <Plus size={15} />
              공벌레 추가
            </button>
          )}
        </div>
      </div>

      {/* Isopod grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl h-56 animate-pulse" />
          ))}
        </div>
      ) : filteredIsopods.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <div className="text-6xl mb-4">🐛</div>
          <h3 className="text-slate-400 text-lg font-semibold mb-2">공벌레가 없습니다</h3>
          <p className="text-slate-500 text-sm mb-6">
            {filter !== 'all' ? '해당 조건의 공벌레가 없습니다.' : '첫 번째 공벌레를 추가해보세요!'}
          </p>
          {filter === 'all' && gameState && gameState.totalIsopods < gameState.maxIsopods && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 mx-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors"
            >
              <Plus size={16} />
              첫 공벌레 추가하기
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence>
            {filteredIsopods.map((isopod) => (
              <motion.div
                key={isopod._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <IsopodCard
                  isopod={isopod}
                  onFeed={(id) => feed(id)}
                  onCare={(iso) => setSelectedIsopod(iso)}
                  onClick={() => setSelectedIsopod(isopod)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Items stock bar */}
      {gameState && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
          <h3 className="text-slate-400 text-sm font-semibold mb-3">보유 아이템</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🍃</span>
              <div>
                <div className="text-white text-sm font-semibold">{gameState.feedStock}</div>
                <div className="text-slate-500 text-xs">먹이</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">💧</span>
              <div>
                <div className="text-white text-sm font-semibold">{gameState.moistureSpray}</div>
                <div className="text-slate-500 text-xs">습도 스프레이</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🔥</span>
              <div>
                <div className="text-white text-sm font-semibold">{gameState.heater}</div>
                <div className="text-slate-500 text-xs">히터</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">❄️</span>
              <div>
                <div className="text-white text-sm font-semibold">{gameState.cooler}</div>
                <div className="text-slate-500 text-xs">쿨러</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Isopod detail modal */}
      <AnimatePresence>
        {selectedIsopod && (
          <IsopodDetails
            isopod={selectedIsopod}
            onClose={() => setSelectedIsopod(null)}
            onFeed={(id) => { feed(id); setSelectedIsopod(null); }}
            onCare={(id, action) => { care({ id, action }); setSelectedIsopod(null); }}
          />
        )}
      </AnimatePresence>

      {/* Add isopod modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddIsopodModal
            onClose={() => setShowAddModal(false)}
            onAdd={(name, species) => {
              return new Promise<void>((resolve) => {
                create(
                  { name, species },
                  {
                    onSuccess: () => resolve(),
                    onError: () => resolve(),
                  }
                );
              });
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
