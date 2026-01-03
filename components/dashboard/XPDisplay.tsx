'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { getLevelProgress, getLevelTitle, formatXP } from '@/lib/xpSystem';

interface XPDisplayProps {
    xp: number;
    level?: number; // Optional - wird jetzt berechnet
    nextLevelXp?: number; // Deprecated
}

export function XPDisplay({ xp }: XPDisplayProps) {
    const progress = getLevelProgress(xp);
    const levelTitle = getLevelTitle(progress.currentLevel);

    return (
        <div className="w-full glass-panel rounded-2xl p-4 mb-4 relative overflow-hidden">
            {/* Glow behind */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex justify-between items-end mb-2 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                        <Trophy size={16} />
                    </div>
                    <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                            {levelTitle}
                        </span>
                        <div className="text-2xl font-bold text-foreground leading-none">
                            Level {progress.currentLevel}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-primary font-mono font-bold text-lg">
                        {progress.xpInCurrentLevel}
                    </span>
                    <span className="text-muted-foreground text-xs ml-1">
                        / {progress.xpRequiredForNextLevel} XP
                    </span>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 w-full bg-background/50 rounded-full overflow-hidden relative">
                <motion.div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/70 to-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress.progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            
            {/* Total XP Indicator */}
            <div className="mt-2 text-center">
                <span className="text-[10px] text-muted-foreground/60 font-mono">
                    Total: {formatXP(xp)} XP
                </span>
            </div>
        </div>
    );
}
