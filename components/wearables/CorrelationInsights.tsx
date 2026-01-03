'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHealthData } from '@/lib/wearables';
import { getCheckInHistory, getUserStack } from '@/lib/supabaseService';
import { 
  analyzeSupplementCorrelations, 
  generateInsights,
  calculateStackEffectiveness,
  SupplementCorrelation,
  CorrelationInsight 
} from '@/lib/wearables/correlationAnalyzer';

interface CorrelationInsightsProps {
  userId: string;
  className?: string;
}

export function CorrelationInsights({ userId, className }: CorrelationInsightsProps) {
  const [correlations, setCorrelations] = useState<SupplementCorrelation[]>([]);
  const [insights, setInsights] = useState<CorrelationInsight[]>([]);
  const [effectiveness, setEffectiveness] = useState<{
    score: number;
    grade: string;
    summary: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllCorrelations, setShowAllCorrelations] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      try {
        // Parallele API Calls
        const [healthData, checkInHistory, stack] = await Promise.all([
          getHealthData(userId, 30),
          getCheckInHistory(userId, 30),
          getUserStack(userId),
        ]);

        // Check-Ins nach Datum gruppieren
        const checkInsByDate = new Map<string, string[]>();
        checkInHistory.forEach(ci => {
          const date = ci.checkedAt.split('T')[0];
          if (!checkInsByDate.has(date)) {
            checkInsByDate.set(date, []);
          }
          checkInsByDate.get(date)!.push(ci.supplementId);
        });

        // Supplement Namen Map
        const supplementNames = new Map<string, string>();
        stack.forEach(item => {
          supplementNames.set(item.supplement_id, item.supplement?.name || item.supplement_id);
        });

        // Korrelationen berechnen
        const correlationResults = analyzeSupplementCorrelations(
          healthData,
          checkInsByDate,
          supplementNames
        );

        setCorrelations(correlationResults);
        setInsights(generateInsights(correlationResults));
        setEffectiveness(calculateStackEffectiveness(correlationResults));
      } catch (error) {
        console.error('Error loading correlation data:', error);
      }
      
      setIsLoading(false);
    }

    loadData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={cn("glass-panel p-4 rounded-xl", className)}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-white/10 animate-pulse" />
          <div>
            <div className="h-4 w-32 bg-white/10 rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
          </div>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (correlations.length === 0) {
    return (
      <div className={cn("glass-panel p-6 rounded-xl text-center", className)}>
        <BarChart3 size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
        <h3 className="font-medium text-foreground mb-1">Noch keine Korrelationen</h3>
        <p className="text-sm text-muted-foreground">
          Tracke mindestens 7 Tage um Muster zu erkennen.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Je länger du trackst, desto genauer werden die Insights.
        </p>
      </div>
    );
  }

  const topCorrelations = showAllCorrelations ? correlations : correlations.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-panel p-4 rounded-xl", className)}
    >
      {/* Header mit Stack Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Sparkles size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Stack Insights</h3>
            <p className="text-xs text-muted-foreground">
              Basierend auf {correlations.length} Korrelationen
            </p>
          </div>
        </div>
        
        {effectiveness && (
          <div className="text-center">
            <div className={cn(
              "text-2xl font-bold",
              effectiveness.grade === 'A' ? 'text-green-400' :
              effectiveness.grade === 'B' ? 'text-lime-400' :
              effectiveness.grade === 'C' ? 'text-yellow-400' :
              effectiveness.grade === 'D' ? 'text-orange-400' :
              'text-red-400'
            )}>
              {effectiveness.grade}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {effectiveness.score}%
            </div>
          </div>
        )}
      </div>

      {/* Effectiveness Summary */}
      {effectiveness && (
        <div className="p-3 rounded-lg bg-white/5 mb-4">
          <p className="text-sm text-muted-foreground">
            {effectiveness.summary}
          </p>
        </div>
      )}

      {/* Insights */}
      {insights.length > 0 && (
        <div className="space-y-2 mb-4">
          {insights.slice(0, 3).map((insight, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-3 rounded-lg border flex items-start gap-3",
                insight.type === 'positive' ? 'bg-green-500/10 border-green-500/30' :
                insight.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                insight.type === 'suggestion' ? 'bg-blue-500/10 border-blue-500/30' :
                'bg-white/5 border-white/10'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md flex-shrink-0",
                insight.type === 'positive' ? 'bg-green-500/20' :
                insight.type === 'warning' ? 'bg-yellow-500/20' :
                'bg-blue-500/20'
              )}>
                {insight.type === 'positive' ? <TrendingUp size={14} className="text-green-400" /> :
                 insight.type === 'warning' ? <AlertTriangle size={14} className="text-yellow-400" /> :
                 <Lightbulb size={14} className="text-blue-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-foreground">{insight.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                {insight.actionLabel && (
                  <button className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline">
                    {insight.actionLabel}
                    <ChevronRight size={12} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Correlation Details */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs text-muted-foreground uppercase tracking-wider">
            Erkannte Muster
          </h4>
          {correlations.length > 3 && (
            <button
              onClick={() => setShowAllCorrelations(!showAllCorrelations)}
              className="text-xs text-primary hover:underline"
            >
              {showAllCorrelations ? 'Weniger' : `+${correlations.length - 3} mehr`}
            </button>
          )}
        </div>
        
        <AnimatePresence mode="popLayout">
          {topCorrelations.map((corr, index) => (
            <motion.div
              key={`${corr.supplementId}-${corr.metric}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 rounded-lg bg-white/5 border border-white/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{corr.emoji}</span>
                  <span className="font-medium text-sm text-foreground">
                    {corr.supplementName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    → {corr.metricLabel}
                  </span>
                </div>
                <div className={cn(
                  "flex items-center gap-1 text-sm font-mono font-bold",
                  corr.direction === 'positive' ? 'text-green-400' :
                  corr.direction === 'negative' ? 'text-red-400' :
                  'text-muted-foreground'
                )}>
                  {corr.direction === 'positive' ? <TrendingUp size={14} /> : 
                   corr.direction === 'negative' ? <TrendingDown size={14} /> : null}
                  {corr.differencePercent > 0 ? '+' : ''}{corr.differencePercent}%
                </div>
              </div>
              
              {/* Mini Bar Chart */}
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span>Mit {corr.supplementName}</span>
                    <span className="font-mono">{corr.withSupplementAvg}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        corr.direction === 'positive' ? 'bg-green-500' :
                        corr.direction === 'negative' ? 'bg-red-500' :
                        'bg-white/30'
                      )}
                      style={{ 
                        width: `${Math.min(100, (corr.withSupplementAvg / Math.max(corr.withSupplementAvg, corr.withoutSupplementAvg)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span>Ohne</span>
                    <span className="font-mono">{corr.withoutSupplementAvg}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white/30 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (corr.withoutSupplementAvg / Math.max(corr.withSupplementAvg, corr.withoutSupplementAvg)) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Confidence */}
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                <span className="text-[10px] text-muted-foreground/60">
                  {corr.sampleSizeWith + corr.sampleSizeWithout} Tage analysiert
                </span>
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded",
                  corr.significance === 'high' ? 'bg-green-500/20 text-green-400' :
                  corr.significance === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-white/10 text-muted-foreground'
                )}>
                  {corr.confidence}% Konfidenz
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t border-white/10 text-center">
        <p className="text-[10px] text-muted-foreground/60">
          💡 Korrelation ≠ Kausalität • Längeres Tracking = bessere Insights
        </p>
      </div>
    </motion.div>
  );
}

