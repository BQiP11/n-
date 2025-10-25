import React from 'react';
import type { Chapter } from '../types';
// FIX: Removed LockClosedIcon from import as it is not exported from Icons.tsx
import { CheckCircleIcon, BrainCircuitIcon } from './Icons'; 

// A placeholder for LockClosedIcon if it's not in Icons.tsx
const LockPlaceholder: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className || "w-6 h-6"}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
);


interface SkillTreeNodeProps {
    chapter: Chapter;
    progressPercentage: number;
    isUnlocked: boolean;
    onClick?: () => void;
}

const SkillTreeNode: React.FC<SkillTreeNodeProps> = ({ chapter, progressPercentage, isUnlocked, onClick }) => {
    const isMastered = progressPercentage === 100;
    
    let stateStyles = 'bg-bg-synapse-medium border-border-color text-text-secondary cursor-not-allowed';
    let icon = <LockPlaceholder className="w-8 h-8" />;
    
    if (isUnlocked) {
        stateStyles = 'bg-bg-glass border-accent-magenta/50 text-accent-magenta hover:border-accent-magenta hover:bg-accent-magenta/10 cursor-pointer';
        icon = <BrainCircuitIcon className="w-8 h-8" />;
    }
    
    if (isUnlocked && isMastered) {
        stateStyles = 'bg-green-500/10 border-green-500/80 text-green-300 cursor-pointer';
        icon = <CheckCircleIcon className="w-8 h-8" />;
    }

    return (
        <button
            onClick={onClick}
            disabled={!isUnlocked}
            className={`w-36 h-36 rounded-full flex flex-col items-center justify-center p-3 text-center border-2 transition-all duration-300 transform hover:scale-105 ${stateStyles}`}
            style={{boxShadow: isUnlocked ? 'var(--accent-glow)' : 'none'}}
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center">
                {/* Progress Circle */}
                <svg className="absolute w-full h-full" viewBox="0 0 100 100" style={{transform: 'rotate(-90deg)'}}>
                    <circle cx="50" cy="50" r="45" stroke="var(--border-color)" strokeWidth="4" fill="transparent" />
                    {isUnlocked && (
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            stroke={isMastered ? 'var(--green-500)' : 'var(--accent-magenta)'}
                            strokeWidth="4"
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 45}
                            strokeDashoffset={(2 * Math.PI * 45) * (1 - progressPercentage / 100)}
                            className="transition-all duration-500"
                        />
                    )}
                </svg>

                <div className="z-10 flex flex-col items-center">
                    {icon}
                    <p className="text-xs font-semibold mt-1">CHƯƠNG {chapter.chapter}</p>
                    <p className="text-[10px] leading-tight mt-1">{chapter.title}</p>
                </div>
            </div>
        </button>
    );
};

export default SkillTreeNode;