'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuestItemProps {
  title: string;
  description: string;
  xp: number;
  progress: number;
  total: number;
  completed: boolean;
  isHelix?: boolean;
}

export function QuestItem({ 
  title, 
  description, 
  xp, 
  progress, 
  total, 
  completed,
  isHelix = false,
}: QuestItemProps) {
  const percent = total > 0 ? (progress / total) * 100 : 0;
  
  return (
    <div className={cn(
      "p-4 rounded-xl border transition-all",
      completed 
        ? isHelix ? "bg-primary/10 border-primary/30" : "bg-purple-500/10 border-purple-500/30" 
        : isHelix ? "bg-primary/5 border-primary/10" : "bg-white/5 border-white/10"
    )}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold text-foreground flex items-center gap-2">
            {completed && <span className={isHelix ? "text-primary" : "text-purple-400"}>✓</span>}
            {title}
          </div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        <div className={cn(
          "text-xs font-bold px-2 py-1 rounded-lg",
          completed 
            ? isHelix ? "bg-primary text-primary-foreground" : "bg-purple-500 text-white" 
            : "bg-white/10 text-muted-foreground"
        )}>
          +{xp} XP
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            "h-full rounded-full",
            completed ? "bg-purple-500" : "bg-purple-500/50"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-[10px] text-muted-foreground mt-1 text-right">
        {progress}/{total}
      </div>
    </div>
  );
}
