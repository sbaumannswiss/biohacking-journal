'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, ChevronRight, X, AlertTriangle, Clock, Pill, Sparkles, Heart } from 'lucide-react';
import { Recommendation } from '@/lib/recommendations';
import { cn } from '@/lib/utils';

interface RecommendationCardProps {
  recommendations: Recommendation[];
  isLoading?: boolean;
}

const typeIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  timing: Clock,
  dosage: Pill,
  synergy: Sparkles,
  lifestyle: Heart,
  warning: AlertTriangle,
};

const priorityColors: Record<string, string> = {
  low: 'border-muted-foreground/20 bg-muted/10',
  medium: 'border-primary/30 bg-primary/5',
  high: 'border-amber-500/30 bg-amber-500/5',
  critical: 'border-red-500/30 bg-red-500/5',
};

const priorityTextColors: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-primary',
  high: 'text-amber-500',
  critical: 'text-red-500',
};

export function RecommendationCard({ recommendations, isLoading }: RecommendationCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Filtere dismissed recommendations
  const activeRecs = recommendations.filter(r => !dismissed.has(r.id));
  const currentRec = activeRecs[currentIndex % activeRecs.length];

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
    if (currentIndex >= activeRecs.length - 1) {
      setCurrentIndex(0);
    }
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % activeRecs.length);
  };

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-4 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/10" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded w-3/4 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (activeRecs.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Lightbulb size={20} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Alles optimal!</p>
            <p className="text-xs text-muted-foreground">Keine Empfehlungen momentan</p>
          </div>
        </div>
      </div>
    );
  }

  const Icon = typeIcons[currentRec.type] || Lightbulb;

  return (
    <motion.div
      className={cn(
        "glass-panel rounded-2xl p-4 border",
        priorityColors[currentRec.priority]
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRec.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
              currentRec.priority === 'critical' ? 'bg-red-500/20' :
              currentRec.priority === 'high' ? 'bg-amber-500/20' :
              'bg-primary/20'
            )}>
              <Icon size={20} className={priorityTextColors[currentRec.priority]} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className={cn(
                  "text-xs font-semibold uppercase tracking-wider",
                  priorityTextColors[currentRec.priority]
                )}>
                  {currentRec.type === 'warning' ? 'Hinweis' :
                   currentRec.type === 'timing' ? 'Timing' :
                   currentRec.type === 'dosage' ? 'Dosierung' :
                   currentRec.type === 'synergy' ? 'Synergie' :
                   'Insight'}
                </span>
                <button
                  onClick={() => handleDismiss(currentRec.id)}
                  className="p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Schließen"
                >
                  <X size={14} className="text-muted-foreground" />
                </button>
              </div>
              
              <p className="text-sm text-foreground leading-relaxed">
                {currentRec.message}
              </p>
              
              {currentRec.supplement && (
                <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs bg-white/10 text-muted-foreground">
                  {currentRec.supplement}
                </span>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          {activeRecs.length > 1 && (
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
              <span className="text-xs text-muted-foreground">
                {currentIndex + 1} / {activeRecs.length}
              </span>
              <button
                onClick={handleNext}
                className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Nächste <ChevronRight size={14} />
              </button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}

