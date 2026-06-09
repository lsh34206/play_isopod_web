import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, Clock, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react';
import { breedingApi } from '../api/breeding';
import { useIsopods } from '../hooks/useIsopods';
import IsopodCard from '../components/IsopodCard';
import type { Isopod, BreedingSession } from '../types';
import toast from 'react-hot-toast';

function CountdownTimer({ endTime }: { endTime: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const diff = new Date(endTime).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('완료!');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemaining(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return <span>{remaining}</span>;
}

export default function BreedingPage() {
  const { isopods } = useIsopods();
  const queryClient = useQueryClient();
  const [parent1, setParent1] = useState<Isopod | null>(null);
  const [parent2, setParent2] = useState<Isopod | null>(null);
  const [selectingSlot, setSelectingSlot] = useState<1 | 2 | null>(null);

  const breedableIsopods = isopods.filter(
    (iso) => iso.isAlive && iso.canBreed && iso.level >= 10
  );

  const { data: activeSessions = [], refetch: refetchSessions } = useQuery({
    queryKey: ['breeding-active'],
    queryFn: breedingApi.getActive,
    refetchInterval: 5000,
  });

  const startBreedingMutation = useMutation({
    mutationFn: () => {
      if (!parent1 || !parent2) throw new Error('부모를 선택하세요');
      return breedingApi.start(parent1._id, parent2._id);
    },
    onSuccess: () => {
      toast.success('번식이 시작되었습니다! 🥚');
      setParent1(null);
      setParent2(null);
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '번식 시작 실패');
    },
  });

  const collectMutation = useMutation({
    mutationFn: (sessionId: string) => breedingApi.collect(sessionId),
    onSuccess: (session) => {
      toast.success(`🐛 새끼 ${session.offspring.length}마리 수집 완료!`);
      refetchSessions();
      queryClient.invalidateQueries({ queryKey: ['isopods'] });
      queryClient.invalidateQueries({ queryKey: ['gameState'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '수집 실패');
    },
  });

  const handleSelectParent = (iso: Isopod) => {
    if (selectingSlot === 1) {
      if (parent2?._id === iso._id) {
        toast.error('같은 공벌레를 두 번 선택할 수 없습니다');
        return;
      }
      setParent1(iso);
    } else if (selectingSlot === 2) {
      if (parent1?._id === iso._id) {
        toast.error('같은 공벌레를 두 번 선택할 수 없습니다');
        return;
      }
      setParent2(iso);
    }
    setSelectingSlot(null);
  };

  const canBreed = parent1 && parent2 && parent1._id !== parent2._id;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">번식 센터</h1>
        <p className="text-slate-400 text-sm">두 마리의 공벌레를 교배시켜 새끼를 얻으세요</p>
      </div>

      {/* Breeding requirements */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
        <h3 className="text-slate-300 font-semibold text-sm mb-2">번식 조건</h3>
        <div className="flex flex-wrap gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" /> 레벨 10 이상</span>
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" /> 번식 가능 상태</span>
          <span className="flex items-center gap-1"><CheckCircle size={12} className="text-emerald-400" /> 살아있는 상태</span>
          <span className="flex items-center gap-1"><AlertCircle size={12} className="text-amber-400" /> 번식 후 48시간 쿨다운</span>
        </div>
      </div>

      {/* Parent selection */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Selector panels */}
        <div className="space-y-4">
          <h2 className="text-slate-300 font-semibold">부모 선택</h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Parent 1 */}
            <div
              className={`bg-slate-800 border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                selectingSlot === 1
                  ? 'border-amber-500 bg-amber-900/20'
                  : parent1
                  ? 'border-pink-600/60'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectingSlot(selectingSlot === 1 ? null : 1)}
            >
              <div className="text-center text-xs text-slate-400 mb-2 font-semibold">♀ 부모 1</div>
              {parent1 ? (
                <div className="text-center">
                  <div className="text-4xl mb-1">
                    {parent1.species === 'armadillidium' ? '🔵' : parent1.species === 'cubaris' ? '🟤' : '🐛'}
                  </div>
                  <div className="text-white text-sm font-semibold truncate">{parent1.name}</div>
                  <div className="text-slate-400 text-xs">Lv.{parent1.level} {parent1.grade}등급</div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-600">
                  <div className="text-3xl mb-1">+</div>
                  <div className="text-xs">선택</div>
                </div>
              )}
            </div>

            {/* Parent 2 */}
            <div
              className={`bg-slate-800 border-2 rounded-2xl p-4 cursor-pointer transition-all ${
                selectingSlot === 2
                  ? 'border-amber-500 bg-amber-900/20'
                  : parent2
                  ? 'border-blue-600/60'
                  : 'border-slate-700 hover:border-slate-600'
              }`}
              onClick={() => setSelectingSlot(selectingSlot === 2 ? null : 2)}
            >
              <div className="text-center text-xs text-slate-400 mb-2 font-semibold">♂ 부모 2</div>
              {parent2 ? (
                <div className="text-center">
                  <div className="text-4xl mb-1">
                    {parent2.species === 'armadillidium' ? '🔵' : parent2.species === 'cubaris' ? '🟤' : '🐛'}
                  </div>
                  <div className="text-white text-sm font-semibold truncate">{parent2.name}</div>
                  <div className="text-slate-400 text-xs">Lv.{parent2.level} {parent2.grade}등급</div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-600">
                  <div className="text-3xl mb-1">+</div>
                  <div className="text-xs">선택</div>
                </div>
              )}
            </div>
          </div>

          {/* Heart animation between parents */}
          {parent1 && parent2 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              className="text-center text-3xl"
            >
              💕
            </motion.div>
          )}

          <button
            onClick={() => startBreedingMutation.mutate()}
            disabled={!canBreed || startBreedingMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
          >
            <Heart size={18} />
            {startBreedingMutation.isPending ? '번식 시작 중...' : '번식 시작'}
          </button>
        </div>

        {/* Breedable list */}
        <div className="space-y-3">
          <h2 className="text-slate-300 font-semibold">
            번식 가능한 공벌레 ({breedableIsopods.length}마리)
            {selectingSlot && (
              <span className="text-amber-400 text-sm ml-2">
                → {selectingSlot}번 부모를 선택하세요
              </span>
            )}
          </h2>
          {breedableIsopods.length === 0 ? (
            <div className="text-center py-10 bg-slate-800 rounded-2xl border border-slate-700 text-slate-500">
              <div className="text-4xl mb-2">😢</div>
              <p>번식 가능한 공벌레가 없습니다</p>
              <p className="text-sm mt-1">레벨 10 이상이어야 번식이 가능합니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
              {breedableIsopods.map((iso) => (
                <IsopodCard
                  key={iso._id}
                  isopod={iso}
                  compact
                  onClick={() => selectingSlot ? handleSelectParent(iso) : undefined}
                  selected={parent1?._id === iso._id || parent2?._id === iso._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Active breeding sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-slate-300 font-semibold">진행 중인 번식 ({activeSessions.length})</h2>
          <div className="grid gap-3">
            {activeSessions.map((session) => {
              const isComplete =
                new Date(session.endTime).getTime() <= Date.now() || session.isComplete;

              return (
                <motion.div
                  key={session._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-800 border border-slate-700 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <span className="text-2xl">
                          {session.parent1Id?.species === 'armadillidium' ? '🔵' : '🐛'}
                        </span>
                        <Heart size={14} className="text-pink-500" />
                        <span className="text-2xl">
                          {session.parent2Id?.species === 'armadillidium' ? '🔵' : '🐛'}
                        </span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-semibold">
                          {session.parent1Id?.name} × {session.parent2Id?.name}
                        </div>
                        <div className={`text-xs flex items-center gap-1 ${isComplete ? 'text-emerald-400' : 'text-slate-400'}`}>
                          <Clock size={10} />
                          {isComplete ? (
                            <span className="font-bold">번식 완료!</span>
                          ) : (
                            <CountdownTimer endTime={session.endTime} />
                          )}
                        </div>
                      </div>
                    </div>

                    {isComplete && !session.isComplete && (
                      <button
                        onClick={() => collectMutation.mutate(session._id)}
                        disabled={collectMutation.isPending}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                      >
                        🥚 수집
                      </button>
                    )}
                    {session.isComplete && (
                      <div className="flex items-center gap-1 text-emerald-400 text-sm">
                        <CheckCircle size={14} />
                        수집 완료
                      </div>
                    )}
                  </div>

                  {/* Progress bar */}
                  {!isComplete && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-pink-500 rounded-full"
                          initial={{ width: '0%' }}
                          animate={{
                            width: `${Math.min(100, ((Date.now() - new Date(session.startTime).getTime()) / (new Date(session.endTime).getTime() - new Date(session.startTime).getTime())) * 100)}%`,
                          }}
                          transition={{ duration: 1 }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Offspring preview */}
      {activeSessions.some((s) => s.isComplete && s.offspring?.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-slate-300 font-semibold">수집한 새끼</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {activeSessions
              .filter((s) => s.isComplete)
              .flatMap((s) => s.offspring || [])
              .map((offspring) => (
                <IsopodCard key={offspring._id} isopod={offspring} compact />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
