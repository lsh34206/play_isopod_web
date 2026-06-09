import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Utensils, Heart, Star } from 'lucide-react';
import StatBar from './StatBar';
import type { Isopod } from '../types';

interface IsopodCardProps {
  isopod: Isopod;
  onFeed?: (id: string) => void;
  onCare?: (isopod: Isopod) => void;
  selected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const gradeConfig: Record<string, { border: string; badge: string; glow: string; text: string }> = {
  D: {
    border: 'border-slate-500',
    badge: 'bg-slate-600 text-slate-200',
    glow: '',
    text: 'text-slate-400',
  },
  C: {
    border: 'border-emerald-600',
    badge: 'bg-emerald-700 text-emerald-100',
    glow: 'shadow-emerald-900/50',
    text: 'text-emerald-400',
  },
  B: {
    border: 'border-blue-500',
    badge: 'bg-blue-700 text-blue-100',
    glow: 'shadow-blue-900/50',
    text: 'text-blue-400',
  },
  A: {
    border: 'border-purple-500',
    badge: 'bg-purple-700 text-purple-100',
    glow: 'shadow-purple-900/50',
    text: 'text-purple-400',
  },
  S: {
    border: 'border-amber-500',
    badge: 'bg-amber-600 text-amber-100',
    glow: 'shadow-amber-900/50',
    text: 'text-amber-400',
  },
  SS: {
    border: 'border-red-500',
    badge: 'bg-red-700 text-red-100',
    glow: 'shadow-red-900/50',
    text: 'text-red-400',
  },
  SSS: {
    border: 'border-transparent',
    badge: 'bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white',
    glow: 'shadow-purple-900/50',
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-yellow-400 to-blue-400',
  },
};

const speciesEmoji: Record<string, string> = {
  armadillidium: '🔵',
  porcellio: '🐛',
  cubaris: '🟤',
};

const patternStyle: Record<string, string> = {
  normal: '',
  spotted: '•',
  striped: '≡',
  albino: '○',
  melanistic: '◼',
};

function IsopodCreature({ isopod }: { isopod: Isopod }) {
  const emoji = speciesEmoji[isopod.species] || '🐛';
  const pattern = patternStyle[isopod.pattern] || '';
  const gradeConf = gradeConfig[isopod.grade] || gradeConfig.D;

  return (
    <div className="relative flex items-center justify-center h-20 w-full">
      <motion.div
        animate={isopod.isAlive ? { scale: [1, 1.05, 1] } : {}}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        className="text-5xl select-none cursor-default"
        style={{ filter: isopod.isAlive ? 'none' : 'grayscale(100%)' }}
      >
        {emoji}
      </motion.div>
      {pattern && (
        <span className={`absolute bottom-2 right-4 text-xs ${gradeConf.text} opacity-60`}>
          {pattern}
        </span>
      )}
      {isopod.isAlive && (
        <motion.div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs opacity-40"
          animate={{ y: [0, -4, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut', delay: 0.5 }}
        >
          ···
        </motion.div>
      )}
    </div>
  );
}

export default function IsopodCard({
  isopod,
  onFeed,
  onCare,
  selected,
  onClick,
  compact = false,
}: IsopodCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const gradeConf = gradeConfig[isopod.grade] || gradeConfig.D;

  const expPercent = isopod.expToNextLevel > 0
    ? Math.min(100, (isopod.exp / isopod.expToNextLevel) * 100)
    : 100;

  if (compact) {
    return (
      <motion.div
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`
          relative bg-slate-800 rounded-xl border-2 p-3 cursor-pointer transition-all
          ${gradeConf.border}
          ${selected ? 'ring-2 ring-white/30' : ''}
          ${!isopod.isAlive ? 'opacity-60' : ''}
        `}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">{speciesEmoji[isopod.species]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm truncate">{isopod.name}</span>
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${gradeConf.badge}`}>
                {isopod.grade}
              </span>
            </div>
            <div className="text-slate-400 text-xs">Lv.{isopod.level}</div>
          </div>
          {!isopod.isAlive && <Skull size={16} className="text-red-400 flex-shrink-0" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={onClick}
      whileHover={{ scale: 1.03, y: -4 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative bg-slate-800/90 rounded-2xl border-2 overflow-hidden cursor-pointer
        transition-shadow duration-300
        ${gradeConf.border}
        ${isHovered ? `shadow-xl ${gradeConf.glow}` : 'shadow-md'}
        ${selected ? 'ring-2 ring-white/40' : ''}
        ${isopod.grade === 'SSS' ? 'animate-pulse-slow' : ''}
      `}
    >
      {/* Grade badge */}
      <div className="absolute top-2 right-2 z-10">
        <span className={`text-xs font-black px-2 py-0.5 rounded-full ${gradeConf.badge}`}>
          {isopod.grade}
        </span>
      </div>

      {/* Level badge */}
      <div className="absolute top-2 left-2 z-10">
        <span className="text-xs bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded-full font-mono">
          Lv.{isopod.level}
        </span>
      </div>

      {/* Dead overlay */}
      <AnimatePresence>
        {!isopod.isAlive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-slate-900/80 z-20 flex flex-col items-center justify-center rounded-2xl"
          >
            <Skull size={32} className="text-red-400 mb-1" />
            <span className="text-red-400 font-black text-sm tracking-widest">DEAD</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Isopod creature */}
      <div className="pt-8 px-4">
        <IsopodCreature isopod={isopod} />
      </div>

      {/* Info section */}
      <div className="px-3 pb-3 space-y-2">
        <div className="text-center">
          <div className="text-white font-bold text-sm truncate">{isopod.name}</div>
          <div className="text-slate-400 text-xs capitalize">{isopod.species}</div>
        </div>

        {/* Stats */}
        <div className="space-y-1.5">
          <StatBar type="health" value={isopod.health} compact />
          <StatBar type="hunger" value={isopod.hunger} compact />
          <StatBar type="humidity" value={isopod.humidity} compact />
        </div>

        {/* EXP bar */}
        <div>
          <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-500"
              style={{ width: `${expPercent}%` }}
            />
          </div>
          <div className="text-slate-500 text-xs mt-0.5 text-right">
            EXP {isopod.exp}/{isopod.expToNextLevel}
          </div>
        </div>

        {/* Action buttons */}
        <AnimatePresence>
          {isHovered && isopod.isAlive && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="flex gap-2 pt-1"
              onClick={(e) => e.stopPropagation()}
            >
              {onFeed && (
                <button
                  onClick={() => onFeed(isopod._id)}
                  className="flex-1 flex items-center justify-center gap-1 bg-amber-600 hover:bg-amber-500 text-white text-xs py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Utensils size={11} />
                  먹이
                </button>
              )}
              {onCare && (
                <button
                  onClick={() => onCare(isopod)}
                  className="flex-1 flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-500 text-white text-xs py-1.5 rounded-lg transition-colors font-medium"
                >
                  <Heart size={11} />
                  케어
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* SSS rainbow border animation */}
      {isopod.grade === 'SSS' && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, #ef4444, #f59e0b, #10b981, #3b82f6, #8b5cf6, #ef4444)',
            backgroundSize: '300% 100%',
            animation: 'rainbow 3s linear infinite',
            opacity: 0.3,
            zIndex: 0,
          }}
        />
      )}

      {/* Sell price */}
      <div className="absolute bottom-1 right-2 flex items-center gap-0.5">
        <Star size={8} className="text-amber-500" />
        <span className="text-amber-500 text-xs font-mono">{isopod.sellPrice}</span>
      </div>
    </motion.div>
  );
}
