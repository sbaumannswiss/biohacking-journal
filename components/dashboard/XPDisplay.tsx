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
        <div className="glass-panel rounded-2xl p-3 relative overflow-hidden h-full flex flex-col justify-between">
            {/* Header Row */}
            <div className="flex items-start justify-between gap-2 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="bg-primary/20 p-1.5 rounded-lg text-primary">
                        <Trophy size={14} />
                    </div>
                    <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block">
                            {levelTitle}
                        </span>
                        <div className="text-xl font-bold text-foreground leading-tight">
                            Level {progress.currentLevel}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-primary font-mono font-bold">
                        {progress.xpInCurrentLevel}
                    </span>
                    <span className="text-muted-foreground text-[10px]">
                        /{progress.xpRequiredForNextLevel}
                    </span>
                    <span className="text-muted-foreground text-[10px] block">XP</span>
                </div>
            </div>

            {/* Progress Bar - More visible */}
            <div className="mt-3">
                <div className="h-2.5 w-full bg-white/10 rounded-full overflow-hidden relative border border-white/5">
                    <motion.div
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary/80 via-primary to-primary/90 rounded-full"
                        style={{ boxShadow: '0 0 10px rgba(79, 255, 176, 0.4)' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.progressPercent}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </div>
                <span className="text-[9px] text-muted-foreground/70 font-mono mt-1.5 block">
                    {formatXP(xp)} XP gesamt
                </span>
            </div>
        </div>
    );
}
