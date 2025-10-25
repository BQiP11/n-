import React from 'react';
import type { LearningStatus } from '../types';

interface HexagonProps {
    status: LearningStatus;
    onClick: () => void;
    children: React.ReactNode;
}

const Hexagon: React.FC<HexagonProps> = ({ status, onClick, children }) => {
    const statusClasses = {
        new: 'border-border-color/50 text-text-secondary hover:border-accent-aqua hover:text-accent-aqua',
        learning: 'border-accent-pink/70 text-accent-pink',
        review: 'border-yellow-400/80 text-yellow-300 animate-pulse-glow',
        mastered: 'border-green-500/70 text-green-300',
    };

    return (
        <button
            onClick={onClick}
            className={`relative w-[var(--hexagon-size)] h-[calc(var(--hexagon-size)*1.1547)] flex items-center justify-center transition-all duration-300 group ${statusClasses[status]}`}
            style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                borderWidth: '2px'
            }}
        >
            <div className={`absolute inset-0.5 bg-bg-primary group-hover:bg-bg-synapse-medium transition-colors`} style={{
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}></div>
            <div className="relative z-10 text-center flex flex-col items-center justify-center p-2">
                {children}
            </div>
        </button>
    );
};

export default Hexagon;