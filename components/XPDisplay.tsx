import React from 'react';
import type { UserProgress } from '../types';
import { BrainCircuitIcon } from './Icons';

interface XPDisplayProps {
  progress: UserProgress;
}

const XPDisplay: React.FC<XPDisplayProps> = ({ progress }) => {
  const { level, xp, xpToNextLevel } = progress;
  const percentage = xpToNextLevel > 0 ? (xp / xpToNextLevel) * 100 : 0;

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-end mb-2">
        <div className="flex items-center">
            <span className="text-xl font-display text-accent-magenta bg-accent-magenta/10 border border-accent-magenta/30 rounded-md px-3 py-1 mr-4">
                LVL {level}
            </span>
            <div>
                <h3 className="text-lg font-bold text-text-primary">Tiến trình</h3>
                <p className="text-sm text-text-secondary">Tích lũy XP để nâng cao cấp độ</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-semibold text-accent-pink text-sm flex items-center justify-end">
                <BrainCircuitIcon className="w-4 h-4 mr-1"/>
                {xp} <span className="text-text-secondary ml-1">/ {xpToNextLevel} XP</span>
            </p>
        </div>
      </div>
      <div className="w-full bg-bg-synapse-medium rounded-full h-3 border border-border-color p-0.5">
        <div className="h-full rounded-full bg-accent-magenta transition-all duration-500" style={{ width: `${percentage}%`, boxShadow: 'var(--accent-glow)' }}></div>
      </div>
    </div>
  );
};

export default XPDisplay;
