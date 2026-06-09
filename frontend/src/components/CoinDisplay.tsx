import React, { useEffect, useRef, useState } from 'react';
import { Coins, Gem } from 'lucide-react';

interface CoinDisplayProps {
  coins: number;
  gems?: number;
  idleEarnings?: number;
  compact?: boolean;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value === prevValue.current) return;
    const diff = value - prevValue.current;
    const steps = 20;
    const stepSize = diff / steps;
    let current = prevValue.current;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      current += stepSize;
      setDisplayValue(Math.round(current));
      if (step >= steps) {
        setDisplayValue(value);
        prevValue.current = value;
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [value]);

  return <span>{displayValue.toLocaleString()}</span>;
}

export default function CoinDisplay({ coins, gems, idleEarnings = 0, compact = false }: CoinDisplayProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-amber-900/30 border border-amber-700/50 rounded-lg px-3 py-1.5">
          <Coins size={14} className="text-amber-400" />
          <span className="text-amber-300 font-bold text-sm font-mono">
            <AnimatedNumber value={coins} />
          </span>
        </div>
        {gems !== undefined && (
          <div className="flex items-center gap-1.5 bg-violet-900/30 border border-violet-700/50 rounded-lg px-3 py-1.5">
            <Gem size={14} className="text-violet-400" />
            <span className="text-violet-300 font-bold text-sm font-mono">
              <AnimatedNumber value={gems} />
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2 bg-amber-900/30 border border-amber-700/50 rounded-xl px-4 py-2">
        <Coins size={18} className="text-amber-400" />
        <div>
          <div className="text-amber-300 font-bold text-lg font-mono">
            <AnimatedNumber value={coins} />
          </div>
          {idleEarnings > 0 && (
            <div className="text-amber-500 text-xs">
              +<AnimatedNumber value={Math.round(idleEarnings)} /> 획득 중
            </div>
          )}
        </div>
      </div>
      {gems !== undefined && (
        <div className="flex items-center gap-2 bg-violet-900/30 border border-violet-700/50 rounded-xl px-4 py-2">
          <Gem size={18} className="text-violet-400" />
          <div className="text-violet-300 font-bold text-lg font-mono">
            <AnimatedNumber value={gems} />
          </div>
        </div>
      )}
    </div>
  );
}
