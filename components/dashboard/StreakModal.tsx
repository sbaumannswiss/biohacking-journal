'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Flame, Zap, Trophy, Target, Calendar, TrendingUp, Crown, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
}

// Streak-Meilensteine
const MILESTONES = [
  { days: 3, label: 'Starter', emoji: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { days: 7, label: 'Weekly Warrior', emoji: '⚡', color: 'text-yellow-400', bg: 'bg-yellow-500/20' },
  { days: 14, label: 'Fortnight Force', emoji: '💪', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  { days: 21, label: 'Habit Builder', emoji: '🧠', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { days: 30, label: 'Monthly Master', emoji: '👑', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { days: 60, label: 'Double Down', emoji: '🏆', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
  { days: 90, label: 'Quarterly Legend', emoji: '🌟', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  { days: 180, label: 'Half-Year Hero', emoji: '🔮', color: 'text-violet-400', bg: 'bg-violet-500/20' },
  { days: 365, label: 'Annual Champion', emoji: '💎', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
];

// Emotionale Nachrichten basierend auf Streak
const getStreakMessage = (streak: number): { title: string; message: string; emoji: string } => {
  if (streak === 0) {
    return {
      title: 'Zeit für einen Neustart!',
      message: 'Jeder Champion hat mal bei Null angefangen. Heute ist dein Tag – starte deinen Streak!',
      emoji: '🌱',
    };
  }
  if (streak === 1) {
    return {
      title: 'Der erste Schritt!',
      message: 'Großartig! Du hast den wichtigsten Schritt gemacht – angefangen. Mach morgen weiter!',
      emoji: '🚀',
    };
  }
  if (streak === 2) {
    return {
      title: 'Momentum aufgebaut!',
      message: 'Zwei Tage in Folge! Du zeigst echtes Commitment. Weiter so!',
      emoji: '⚡',
    };
  }
  if (streak >= 3 && streak < 7) {
    return {
      title: 'Du bist auf Kurs!',
      message: `${streak} Tage Konsistenz – das ist der Schlüssel zu echten Ergebnissen. Du machst das fantastisch!`,
      emoji: '🔥',
    };
  }
  if (streak >= 7 && streak < 14) {
    return {
      title: 'Eine Woche geschafft!',
      message: 'Eine volle Woche Dedication! Dein Körper und Geist danken es dir. Du bist ein Weekly Warrior!',
      emoji: '💪',
    };
  }
  if (streak >= 14 && streak < 21) {
    return {
      title: 'Zwei Wochen Power!',
      message: 'Wissenschaft sagt: Nach 14 Tagen werden Gewohnheiten gefestigt. Du bist auf dem besten Weg!',
      emoji: '🧬',
    };
  }
  if (streak >= 21 && streak < 30) {
    return {
      title: 'Habit Formed!',
      message: '21+ Tage – die klassische Habit-Marke! Das hier ist jetzt Teil von dir. Unstoppable!',
      emoji: '🧠',
    };
  }
  if (streak >= 30 && streak < 60) {
    return {
      title: 'Ein Monat Excellence!',
      message: '30+ Tage konstant optimieren. Du bist nicht mehr nur dabei – du LEBST es. Respekt!',
      emoji: '👑',
    };
  }
  if (streak >= 60 && streak < 90) {
    return {
      title: 'Zwei Monate Legend!',
      message: 'Die meisten geben nach 2 Wochen auf. Du bist seit 60+ Tagen dabei. Du bist außergewöhnlich!',
      emoji: '🏆',
    };
  }
  if (streak >= 90 && streak < 180) {
    return {
      title: 'Quartals-Champion!',
      message: '90+ Tage – ein ganzes Quartal! Dein Commitment ist inspirierend. Du definierst neu, was möglich ist!',
      emoji: '🌟',
    };
  }
  if (streak >= 180 && streak < 365) {
    return {
      title: 'Halbjahres-Held!',
      message: 'Über ein halbes Jahr täglich am optimieren. Du gehörst zur Elite der Biohacker!',
      emoji: '🔮',
    };
  }
  // 365+
  return {
    title: 'Ein Jahr. Jeden Tag.',
    message: '365+ Tage Streak. Du hast bewiesen, dass Exzellenz kein Zufall ist – es ist deine Entscheidung!',
    emoji: '💎',
  };
};

// Nächster Meilenstein
const getNextMilestone = (streak: number) => {
  return MILESTONES.find(m => m.days > streak);
};

// Aktuell erreichter Meilenstein
const getCurrentMilestone = (streak: number) => {
  return [...MILESTONES].reverse().find(m => m.days <= streak);
};

export function StreakModal({ isOpen, onClose, streak }: StreakModalProps) {
  const streakMessage = getStreakMessage(streak);
  const nextMilestone = getNextMilestone(streak);
  const currentMilestone = getCurrentMilestone(streak);
  const progressToNext = nextMilestone
    ? ((streak - (currentMilestone?.days || 0)) / (nextMilestone.days - (currentMilestone?.days || 0))) * 100
    : 100;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="w-full max-w-sm glass-panel rounded-2xl overflow-hidden border border-orange-500/20"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header mit animierter Flamme */}
            <div className="relative bg-gradient-to-b from-orange-500/20 to-transparent p-6 text-center">
              {/* Hintergrund-Partikel */}
              <div className="absolute inset-0 overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-orange-400/30 rounded-full"
                    initial={{ 
                      x: 50 + Math.random() * 200, 
                      y: 100,
                      opacity: 0 
                    }}
                    animate={{ 
                      y: -20,
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      repeat: Infinity,
                      delay: i * 0.3,
                    }}
                  />
                ))}
              </div>

              {/* Große Flammen-Animation */}
              <motion.div
                className="relative mx-auto w-24 h-24 mb-4"
                animate={{ 
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl" />
                <div className="relative w-full h-full bg-gradient-to-b from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                  <Flame size={48} className="text-white drop-shadow-lg" fill="currentColor" />
                </div>
                {/* Streak-Zahl */}
                <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-black/80 border-2 border-orange-400 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 font-bold text-lg">{streak}</span>
                </div>
              </motion.div>

              {/* Titel */}
              <div className="text-4xl mb-2">{streakMessage.emoji}</div>
              <h2 className="text-xl font-bold text-white mb-1">{streakMessage.title}</h2>
              <p className="text-orange-200/80 text-sm">
                {streak === 1 ? '1 Tag Streak' : `${streak} Tage Streak`}
              </p>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={18} className="text-white/70" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Emotionale Message */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                <p className="text-sm text-muted-foreground leading-relaxed text-center">
                  {streakMessage.message}
                </p>
              </div>

              {/* Aktueller Meilenstein */}
              {currentMilestone && (
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-xl border",
                  currentMilestone.bg,
                  "border-white/10"
                )}>
                  <div className="text-2xl">{currentMilestone.emoji}</div>
                  <div>
                    <div className={cn("font-bold text-sm", currentMilestone.color)}>
                      {currentMilestone.label}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Erreicht bei {currentMilestone.days} Tagen
                    </div>
                  </div>
                  <Crown className={cn("ml-auto", currentMilestone.color)} size={20} />
                </div>
              )}

              {/* Progress zum nächsten Meilenstein */}
              {nextMilestone && (
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="flex items-center gap-1">
                      <Target size={12} />
                      Nächster Meilenstein
                    </span>
                    <span className={nextMilestone.color}>
                      {nextMilestone.emoji} {nextMilestone.label}
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progressToNext}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>{streak} Tage</span>
                    <span className="flex items-center gap-1">
                      noch {nextMilestone.days - streak} Tage
                      <Sparkles size={10} className="text-amber-400" />
                    </span>
                  </div>
                </div>
              )}

              {/* Alle Meilensteine erreicht */}
              {!nextMilestone && streak >= 365 && (
                <div className="text-center p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-xl border border-emerald-500/20">
                  <Trophy className="mx-auto text-emerald-400 mb-2" size={32} />
                  <p className="text-sm font-bold text-emerald-400">Alle Meilensteine erreicht!</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Du bist eine lebende Legende 🏆
                  </p>
                </div>
              )}

              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Calendar size={16} className="mx-auto text-blue-400 mb-1" />
                  <div className="text-lg font-bold text-foreground">{streak}</div>
                  <div className="text-[10px] text-muted-foreground">Tage</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <TrendingUp size={16} className="mx-auto text-green-400 mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {Math.floor(streak / 7)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Wochen</div>
                </div>
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <Zap size={16} className="mx-auto text-amber-400 mb-1" />
                  <div className="text-lg font-bold text-foreground">
                    {streak * 50}
                  </div>
                  <div className="text-[10px] text-muted-foreground">Bonus XP</div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

