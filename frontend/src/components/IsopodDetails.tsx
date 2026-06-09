import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Thermometer, Droplets, Heart, Utensils, Star, Calendar } from 'lucide-react';
import StatBar from './StatBar';
import type { Isopod } from '../types';

interface IsopodDetailsProps {
  isopod: Isopod | null;
  onClose: () => void;
  onFeed?: (id: string) => void;
  onCare?: (id: string, action: 'spray' | 'heat' | 'cool') => void;
}

const gradeColors: Record<string, string> = {
  D: '#94a3b8',
  C: '#10b981',
  B: '#3b82f6',
  A: '#8b5cf6',
  S: '#f59e0b',
  SS: '#ef4444',
  SSS: '#ff00ff',
};

const speciesLabel: Record<string, string> = {
  armadillidium: '공벌레 (Armadillidium)',
  porcellio: '쥐며느리 (Porcellio)',
  cubaris: '큐바리스 (Cubaris)',
};

const patternLabel: Record<string, string> = {
  normal: '기본',
  spotted: '점박이',
  striped: '줄무늬',
  albino: '알비노',
  melanistic: '흑색증',
};

export default function IsopodDetails({ isopod, onClose, onFeed, onCare }: IsopodDetailsProps) {
  if (!isopod) return null;

  const daysSinceBorn = Math.floor(
    (Date.now() - new Date(isopod.createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  const gradeColor = gradeColors[isopod.grade] || gradeColors.D;

  return (
    <AnimatePresence>
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
          className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-md overflow-hidden"
          style={{ borderColor: gradeColor + '60' }}
        >
          {/* Header */}
          <div
            className="px-5 py-4 flex items-center justify-between"
            style={{ background: `linear-gradient(135deg, ${gradeColor}20, transparent)` }}
          >
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-white font-bold text-xl">{isopod.name}</h2>
                <span
                  className="text-xs font-black px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: gradeColor }}
                >
                  {isopod.grade}
                </span>
              </div>
              <p className="text-slate-400 text-sm">{speciesLabel[isopod.species]}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Creature display */}
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-8xl"
                style={{ filter: isopod.isAlive ? 'none' : 'grayscale(100%)' }}
              >
                {isopod.species === 'armadillidium' ? '🔵' : isopod.species === 'cubaris' ? '🟤' : '🐛'}
              </motion.div>
            </div>

            {/* Basic info grid */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">레벨</div>
                <div className="text-white font-bold text-xl">Lv.{isopod.level}</div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">크기</div>
                <div className="text-white font-bold text-xl">{isopod.size}mm</div>
              </div>
              <div className="bg-slate-700/50 rounded-xl p-3">
                <div className="text-slate-400 text-xs mb-1">패턴</div>
                <div className="text-white font-bold text-sm">{patternLabel[isopod.pattern]}</div>
              </div>
            </div>

            {/* EXP */}
            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>경험치</span>
                <span>{isopod.exp} / {isopod.expToNextLevel}</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (isopod.exp / isopod.expToNextLevel) * 100)}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="space-y-3">
              <h3 className="text-slate-300 text-sm font-semibold">상태</h3>
              <StatBar type="health" value={isopod.health} showValue />
              <StatBar type="hunger" value={isopod.hunger} showValue />
              <StatBar type="humidity" value={isopod.humidity} showValue />
              <StatBar type="happiness" value={isopod.happiness} showValue />
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-400">
                  <Thermometer size={12} />
                  온도
                </span>
                <span className="text-white font-mono">{isopod.temperature}°C</span>
              </div>
            </div>

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-400">
                <Calendar size={14} />
                <span>태어난 지 {daysSinceBorn}일</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Star size={14} className="text-amber-400" />
                <span className="text-amber-400">{isopod.sellPrice.toLocaleString()} 코인</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Heart size={14} />
                <span>번식 횟수: {isopod.breedCount}</span>
              </div>
              <div className={`flex items-center gap-2 ${isopod.canBreed ? 'text-green-400' : 'text-slate-500'}`}>
                <span>{isopod.canBreed ? '✓ 번식 가능' : '✗ 번식 불가'}</span>
              </div>
            </div>

            {/* Action buttons */}
            {isopod.isAlive && (
              <div className="flex gap-3 pt-2">
                {onFeed && (
                  <button
                    onClick={() => { onFeed(isopod._id); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-500 text-white py-2.5 rounded-xl transition-colors font-semibold"
                  >
                    <Utensils size={15} />
                    먹이주기
                  </button>
                )}
                {onCare && (
                  <button
                    onClick={() => { onCare(isopod._id, 'spray'); onClose(); }}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl transition-colors font-semibold"
                  >
                    <Droplets size={15} />
                    습도 조절
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
