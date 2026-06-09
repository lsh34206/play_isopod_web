import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Droplets, Thermometer, Utensils, ChevronRight, AlertTriangle } from 'lucide-react';
import { useIsopods } from '../hooks/useIsopods';
import { useGameState } from '../hooks/useGameState';
import IsopodCard from '../components/IsopodCard';
import StatBar from '../components/StatBar';
import type { Isopod } from '../types';
import toast from 'react-hot-toast';

const IDEAL_HUMIDITY = { min: 60, max: 80 };
const IDEAL_TEMP = { min: 20, max: 26 };

function RangeIndicator({
  value,
  min,
  max,
  label,
  unit,
  icon,
}: {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  icon: React.ReactNode;
}) {
  const isIdeal = value >= min && value <= max;
  const isTooLow = value < min;
  const isTooHigh = value > max;

  return (
    <div className={`bg-slate-700/50 rounded-xl p-4 border ${
      isIdeal ? 'border-emerald-700/50' : 'border-amber-700/50'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-slate-300 text-sm">
          {icon}
          <span>{label}</span>
        </div>
        <div className={`text-lg font-bold ${
          isIdeal ? 'text-emerald-400' : isTooLow ? 'text-blue-400' : 'text-red-400'
        }`}>
          {value}{unit}
        </div>
      </div>
      {/* Range bar */}
      <div className="relative h-3 bg-slate-600 rounded-full overflow-hidden">
        {/* Ideal zone highlight */}
        <div
          className="absolute h-full bg-emerald-900/60"
          style={{
            left: `${(min / 100) * 100}%`,
            width: `${((max - min) / 100) * 100}%`,
          }}
        />
        {/* Current value indicator */}
        <div
          className={`absolute w-2 h-full rounded-full transform -translate-x-1/2 transition-all duration-500 ${
            isIdeal ? 'bg-emerald-400' : 'bg-amber-400'
          }`}
          style={{ left: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>0{unit}</span>
        <span className="text-emerald-600">
          이상: {min}~{max}{unit}
        </span>
        <span>100{unit}</span>
      </div>
      {!isIdeal && (
        <div className="flex items-center gap-1 mt-2 text-xs text-amber-400">
          <AlertTriangle size={12} />
          <span>
            {isTooLow ? `${label} 부족 (+${min - value}${unit} 필요)` : `${label} 과다 (-${value - max}${unit} 필요)`}
          </span>
        </div>
      )}
    </div>
  );
}

export default function CarePage() {
  const { isopods, feed, care, isFeeding, isCaring } = useIsopods();
  const { gameState, refetch: refetchGame } = useGameState();
  const [selectedIsopod, setSelectedIsopod] = useState<Isopod | null>(null);

  const aliveIsopods = isopods.filter((i) => i.isAlive);

  const handleFeed = () => {
    if (!selectedIsopod) return;
    if (!gameState || gameState.feedStock <= 0) {
      toast.error('먹이가 부족합니다! 상점에서 구매하세요.');
      return;
    }
    feed(selectedIsopod._id);
    refetchGame();
  };

  const handleSpray = () => {
    if (!selectedIsopod) return;
    if (!gameState || gameState.moistureSpray <= 0) {
      toast.error('습도 스프레이가 부족합니다!');
      return;
    }
    care({ id: selectedIsopod._id, action: 'spray' });
    refetchGame();
  };

  const handleHeat = () => {
    if (!selectedIsopod) return;
    if (!gameState || gameState.heaterCount <= 0) {
      toast.error('히터가 부족합니다!');
      return;
    }
    care({ id: selectedIsopod._id, action: 'heat' });
    refetchGame();
  };

  const handleCool = () => {
    if (!selectedIsopod) return;
    if (!gameState || gameState.coolerCount <= 0) {
      toast.error('쿨러가 부족합니다!');
      return;
    }
    care({ id: selectedIsopod._id, action: 'cool' });
    refetchGame();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">케어 센터</h1>
        <p className="text-slate-400 text-sm">공벌레들의 건강을 관리하세요</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Isopod list */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-slate-300 font-semibold text-sm">공벌레 선택</h2>
          {aliveIsopods.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <div className="text-4xl mb-2">🐛</div>
              <p>살아있는 공벌레가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {aliveIsopods.map((iso) => {
                const needsAttention =
                  iso.health < 30 ||
                  iso.hunger < 30 ||
                  iso.humidity < IDEAL_HUMIDITY.min ||
                  iso.humidity > IDEAL_HUMIDITY.max ||
                  iso.temperature < IDEAL_TEMP.min ||
                  iso.temperature > IDEAL_TEMP.max;

                return (
                  <motion.button
                    key={iso._id}
                    onClick={() => setSelectedIsopod(iso)}
                    whileHover={{ x: 4 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      selectedIsopod?._id === iso._id
                        ? 'border-amber-500 bg-amber-600/10'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-2xl">
                      {iso.species === 'armadillidium' ? '🔵' : iso.species === 'cubaris' ? '🟤' : '🐛'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-semibold truncate">{iso.name}</span>
                        {needsAttention && (
                          <span className="text-amber-400 text-xs">⚠️</span>
                        )}
                      </div>
                      <div className="flex gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {Math.round(iso.health)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                          {Math.round(iso.hunger)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                          {Math.round(iso.humidity)}%
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Care panel */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {selectedIsopod ? (
              <motion.div
                key={selectedIsopod._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Isopod header */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <div className="flex items-center gap-4">
                    <motion.div
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ repeat: Infinity, duration: 3 }}
                      className="text-6xl"
                    >
                      {selectedIsopod.species === 'armadillidium' ? '🔵' : selectedIsopod.species === 'cubaris' ? '🟤' : '🐛'}
                    </motion.div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-white font-bold text-xl">{selectedIsopod.name}</h2>
                        <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">
                          Lv.{selectedIsopod.level}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <StatBar type="health" value={selectedIsopod.health} showValue />
                        <StatBar type="hunger" value={selectedIsopod.hunger} showValue />
                        <StatBar type="happiness" value={selectedIsopod.happiness} showValue />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Environmental conditions */}
                <div className="grid grid-cols-2 gap-3">
                  <RangeIndicator
                    value={selectedIsopod.humidity}
                    min={IDEAL_HUMIDITY.min}
                    max={IDEAL_HUMIDITY.max}
                    label="습도"
                    unit="%"
                    icon={<Droplets size={14} />}
                  />
                  <RangeIndicator
                    value={selectedIsopod.temperature}
                    min={IDEAL_TEMP.min}
                    max={IDEAL_TEMP.max}
                    label="온도"
                    unit="°C"
                    icon={<Thermometer size={14} />}
                  />
                </div>

                {/* Action buttons */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                  <h3 className="text-slate-300 font-semibold text-sm mb-3">케어 액션</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleFeed}
                      disabled={isFeeding || !gameState || gameState.feedStock <= 0}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-amber-600/20 border border-amber-700/50 hover:bg-amber-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Utensils size={22} className="text-amber-400" />
                      <div>
                        <div className="text-amber-300 font-semibold text-sm">먹이주기</div>
                        <div className="text-amber-600 text-xs">
                          보유: {gameState?.feedStock ?? 0}개
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleSpray}
                      disabled={isCaring || !gameState || gameState.moistureSpray <= 0}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-blue-600/20 border border-blue-700/50 hover:bg-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <Droplets size={22} className="text-blue-400" />
                      <div>
                        <div className="text-blue-300 font-semibold text-sm">습도 스프레이</div>
                        <div className="text-blue-600 text-xs">
                          +10% 습도 • 보유: {gameState?.moistureSpray ?? 0}개
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleHeat}
                      disabled={isCaring || !gameState || gameState.heaterCount <= 0}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-orange-600/20 border border-orange-700/50 hover:bg-orange-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="text-2xl">🔥</span>
                      <div>
                        <div className="text-orange-300 font-semibold text-sm">히터 사용</div>
                        <div className="text-orange-600 text-xs">
                          +3°C • 보유: {gameState?.heaterCount ?? 0}개
                        </div>
                      </div>
                    </button>

                    <button
                      onClick={handleCool}
                      disabled={isCaring || !gameState || gameState.coolerCount <= 0}
                      className="flex flex-col items-center gap-2 p-4 rounded-xl bg-cyan-600/20 border border-cyan-700/50 hover:bg-cyan-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <span className="text-2xl">❄️</span>
                      <div>
                        <div className="text-cyan-300 font-semibold text-sm">쿨러 사용</div>
                        <div className="text-cyan-600 text-xs">
                          -3°C • 보유: {gameState?.coolerCount ?? 0}개
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Ideal conditions info */}
                <div className="bg-emerald-900/20 border border-emerald-700/30 rounded-xl p-3 text-xs text-emerald-400">
                  <p className="font-semibold mb-1">💡 이상적 환경</p>
                  <p>습도: {IDEAL_HUMIDITY.min}~{IDEAL_HUMIDITY.max}% • 온도: {IDEAL_TEMP.min}~{IDEAL_TEMP.max}°C</p>
                  <p className="text-emerald-600 mt-1">환경이 이상적일수록 행복도가 높아지고 더 빠르게 성장합니다.</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-64 text-slate-500"
              >
                <div className="text-6xl mb-4">👈</div>
                <p className="text-lg font-semibold">공벌레를 선택하세요</p>
                <p className="text-sm">왼쪽 목록에서 케어할 공벌레를 선택하세요</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
