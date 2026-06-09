import React from 'react';

type StatType = 'health' | 'hunger' | 'humidity' | 'happiness' | 'temperature';

interface StatBarProps {
  type: StatType;
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  compact?: boolean;
}

const statConfig: Record<StatType, { color: string; bgColor: string; label: string; icon: string }> = {
  health: {
    color: 'bg-emerald-500',
    bgColor: 'bg-emerald-900/30',
    label: '체력',
    icon: '❤️',
  },
  hunger: {
    color: 'bg-amber-500',
    bgColor: 'bg-amber-900/30',
    label: '배고픔',
    icon: '🍃',
  },
  humidity: {
    color: 'bg-blue-500',
    bgColor: 'bg-blue-900/30',
    label: '습도',
    icon: '💧',
  },
  happiness: {
    color: 'bg-pink-500',
    bgColor: 'bg-pink-900/30',
    label: '행복도',
    icon: '😊',
  },
  temperature: {
    color: 'bg-orange-500',
    bgColor: 'bg-orange-900/30',
    label: '온도',
    icon: '🌡️',
  },
};

export default function StatBar({
  type,
  value,
  max = 100,
  label,
  showValue = true,
  compact = false,
}: StatBarProps) {
  const config = statConfig[type];
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const getColorClass = () => {
    if (percentage <= 20) return 'bg-red-500';
    if (percentage <= 40) return 'bg-yellow-500';
    return config.color;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs">{config.icon}</span>
        <div className={`flex-1 h-1.5 rounded-full ${config.bgColor} overflow-hidden`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ${getColorClass()}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-slate-400">
          <span>{config.icon}</span>
          <span>{label ?? config.label}</span>
        </span>
        {showValue && (
          <span className="text-slate-300 font-mono">
            {Math.round(value)}/{max}
          </span>
        )}
      </div>
      <div className={`h-2 rounded-full ${config.bgColor} overflow-hidden`}>
        <div
          className={`h-full rounded-full transition-all duration-500 ${getColorClass()}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
