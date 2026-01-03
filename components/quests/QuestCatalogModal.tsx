'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Zap, Brain, Dumbbell, Moon, Utensils, Heart, Clock, Trophy, Sparkles, ChevronRight } from 'lucide-react';
import { QUESTS, Quest, Category, Difficulty } from '@/data/quests';
import { cn } from '@/lib/utils';

interface QuestCatalogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLevel: number;
  onAcceptQuest: (quest: Quest) => Promise<void>;
  activeQuestIds?: string[];
}

const CATEGORY_CONFIG: Record<Category, { icon: React.ElementType; color: string; bg: string }> = {
  Mind: { icon: Brain, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  Body: { icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  Sleep: { icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  Nutrition: { icon: Utensils, color: 'text-green-400', bg: 'bg-green-500/10' },
  Recovery: { icon: Heart, color: 'text-red-400', bg: 'bg-red-500/10' },
};

const DIFFICULTY_CONFIG: Record<Difficulty, { color: string; bg: string; label: string }> = {
  Beginner: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Beginner' },
  Intermediate: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: 'Intermediate' },
  Advanced: { color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'Advanced' },
  Beast: { color: 'text-red-400', bg: 'bg-red-500/20', label: 'Beast Mode' },
};

export function QuestCatalogModal({
  isOpen,
  onClose,
  userLevel,
  onAcceptQuest,
  activeQuestIds = [],
}: QuestCatalogModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [loadingQuestId, setLoadingQuestId] = useState<string | null>(null);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);

  const filteredQuests = useMemo(() => {
    return QUESTS.filter(q => 
      selectedCategory === 'all' || q.category === selectedCategory
    ).sort((a, b) => a.minLevel - b.minLevel);
  }, [selectedCategory]);

  const unlockedQuests = filteredQuests.filter(q => q.minLevel <= userLevel);
  const lockedQuests = filteredQuests.filter(q => q.minLevel > userLevel);

  const handleAccept = async (quest: Quest) => {
    if (quest.minLevel > userLevel || activeQuestIds.includes(quest.id)) return;
    
    setLoadingQuestId(quest.id);
    try {
      await onAcceptQuest(quest);
      if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    } finally {
      setLoadingQuestId(null);
      setSelectedQuest(null);
    }
  };

  const categories: (Category | 'all')[] = ['all', 'Mind', 'Body', 'Sleep', 'Nutrition', 'Recovery'];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="w-full max-w-lg h-[85vh] glass-panel rounded-t-3xl sm:rounded-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl text-primary">
                  <Trophy size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Quest-Katalog</h2>
                  <p className="text-xs text-muted-foreground">
                    Level {userLevel} • {unlockedQuests.length} verfügbar
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-muted-foreground" />
              </button>
            </div>

            {/* Category Filter */}
            <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0 border-b border-white/5">
              {categories.map((cat) => {
                const isAll = cat === 'all';
                const config = isAll ? null : CATEGORY_CONFIG[cat];
                const Icon = isAll ? Sparkles : config!.icon;
                
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap flex-shrink-0",
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/5 text-muted-foreground hover:bg-white/10"
                    )}
                  >
                    <Icon size={14} />
                    {isAll ? 'Alle' : cat}
                  </button>
                );
              })}
            </div>

            {/* Quest List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Unlocked Quests */}
              {unlockedQuests.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Verfügbar
                  </h3>
                  {unlockedQuests.map((quest, index) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isLocked={false}
                      isActive={activeQuestIds.includes(quest.id)}
                      isLoading={loadingQuestId === quest.id}
                      onSelect={() => setSelectedQuest(quest)}
                      index={index}
                    />
                  ))}
                </div>
              )}

              {/* Locked Quests */}
              {lockedQuests.length > 0 && (
                <div className="space-y-2 mt-6">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Gesperrt
                  </h3>
                  {lockedQuests.map((quest, index) => (
                    <QuestCard
                      key={quest.id}
                      quest={quest}
                      isLocked={true}
                      isActive={false}
                      isLoading={false}
                      onSelect={() => setSelectedQuest(quest)}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Quest Detail Modal */}
          <AnimatePresence>
            {selectedQuest && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[110] flex items-center justify-center p-6"
                onClick={() => setSelectedQuest(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <QuestDetailView
                    quest={selectedQuest}
                    userLevel={userLevel}
                    isActive={activeQuestIds.includes(selectedQuest.id)}
                    isLoading={loadingQuestId === selectedQuest.id}
                    onAccept={() => handleAccept(selectedQuest)}
                    onClose={() => setSelectedQuest(null)}
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function QuestCard({
  quest,
  isLocked,
  isActive,
  isLoading,
  onSelect,
  index,
}: {
  quest: Quest;
  isLocked: boolean;
  isActive: boolean;
  isLoading: boolean;
  onSelect: () => void;
  index: number;
}) {
  const categoryConfig = CATEGORY_CONFIG[quest.category];
  const difficultyConfig = DIFFICULTY_CONFIG[quest.difficulty];
  const Icon = categoryConfig.icon;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={onSelect}
      disabled={isLoading}
      className={cn(
        "w-full p-4 rounded-xl border transition-all text-left group",
        isLocked
          ? "bg-white/5 border-white/5 opacity-60"
          : isActive
          ? "bg-primary/10 border-primary/30"
          : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
          isLocked ? "bg-white/5 text-muted-foreground" : categoryConfig.bg + ' ' + categoryConfig.color
        )}>
          {isLocked ? <Lock size={18} /> : <Icon size={18} />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={cn(
              "font-semibold text-sm truncate",
              isLocked ? "text-muted-foreground" : "text-foreground"
            )}>
              {quest.title}
            </h4>
            {isActive && (
              <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-bold rounded">
                AKTIV
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {quest.description}
          </p>

          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn(
              "px-2 py-0.5 rounded text-[10px] font-medium",
              difficultyConfig.bg, difficultyConfig.color
            )}>
              {quest.difficulty}
            </span>
            
            {quest.duration && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Clock size={10} />
                {quest.duration}
              </span>
            )}

            <span className="flex items-center gap-1 text-[10px] text-primary font-bold ml-auto">
              <Zap size={10} />
              +{quest.xp} XP
            </span>
          </div>

          {isLocked && (
                            <p className="text-[10px] text-orange-400 mt-2">
                              Benötigt Level {quest.minLevel}
                            </p>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  );
}

function QuestDetailView({
  quest,
  userLevel,
  isActive,
  isLoading,
  onAccept,
  onClose,
}: {
  quest: Quest;
  userLevel: number;
  isActive: boolean;
  isLoading: boolean;
  onAccept: () => void;
  onClose: () => void;
}) {
  const isLocked = quest.minLevel > userLevel;
  const categoryConfig = CATEGORY_CONFIG[quest.category];
  const difficultyConfig = DIFFICULTY_CONFIG[quest.difficulty];
  const Icon = categoryConfig.icon;

  return (
    <div className="text-center">
      {/* Icon */}
      <div className={cn(
        "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
        isLocked ? "bg-white/5 text-muted-foreground" : categoryConfig.bg + ' ' + categoryConfig.color
      )}>
        {isLocked ? <Lock size={32} /> : <Icon size={32} />}
      </div>

      {/* Title & Difficulty */}
      <h2 className="text-xl font-bold text-foreground mb-1">{quest.title}</h2>
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          difficultyConfig.bg, difficultyConfig.color
        )}>
          {difficultyConfig.label}
        </span>
        <span className={cn(
          "px-2 py-0.5 rounded text-xs font-medium",
          categoryConfig.bg, categoryConfig.color
        )}>
          {quest.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
        {quest.description}
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-lg font-bold text-primary flex items-center justify-center gap-1">
            <Zap size={18} />
            +{quest.xp}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase">XP Belohnung</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3">
          <div className="text-lg font-bold text-foreground flex items-center justify-center gap-1">
            {quest.duration ? (
              <>
                <Clock size={18} />
                {quest.duration}
              </>
            ) : (
              '∞'
            )}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase">Dauer</div>
        </div>
      </div>

      {/* Level Requirement */}
      {isLocked && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 mb-4">
          <p className="text-sm text-orange-400">
            Diese Quest wird bei <strong>Level {quest.minLevel}</strong> freigeschaltet.
          </p>
          <p className="text-xs text-orange-400/70 mt-1">
            Du bist aktuell Level {userLevel} – noch {quest.minLevel - userLevel} Level!
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
        >
          Schließen
        </button>
        
        {!isLocked && !isActive && (
          <motion.button
            onClick={onAccept}
            disabled={isLoading}
            whileTap={{ scale: 0.98 }}
            className="flex-1 py-3 px-4 bg-primary text-primary-foreground rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <>
                <Zap size={18} />
                Annehmen
              </>
            )}
          </motion.button>
        )}

        {isActive && (
          <div className="flex-1 py-3 px-4 bg-green-500/20 border border-green-500/30 rounded-xl font-bold text-green-400 flex items-center justify-center gap-2">
            ✓ Aktiv
          </div>
        )}
      </div>
    </div>
  );
}

