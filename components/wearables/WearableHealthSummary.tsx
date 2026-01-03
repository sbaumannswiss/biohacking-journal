'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Moon, 
  Heart, 
  Activity, 
  Brain,
  Battery,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getHealthData, NormalizedHealthData } from '@/lib/wearables';

interface WearableHealthSummaryProps {
  userId: string;
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}

function MetricCard({ icon, label, value, unit, trend, trendValue, color }: MetricCardProps) {
  return (
    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("p-1.5 rounded-md", color)}>
          {icon}
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-bold text-foreground">{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trend && trendValue && (
        <div className={cn(
          "flex items-center gap-1 mt-1 text-[10px]",
          trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-muted-foreground'
        )}>
          {trend === 'up' ? <TrendingUp size={10} /> : trend === 'down' ? <TrendingDown size={10} /> : <Minus size={10} />}
          {trendValue}
        </div>
      )}
    </div>
  );
}

export function WearableHealthSummary({ userId, className }: WearableHealthSummaryProps) {
  const [healthData, setHealthData] = useState<NormalizedHealthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      const data = await getHealthData(userId, 7);
      setHealthData(data);
      setIsLoading(false);
    }
    
    loadData();
  }, [userId]);

  if (isLoading) {
    return (
      <div className={cn("glass-panel p-4 rounded-xl", className)}>
        <div className="h-6 w-32 bg-white/10 rounded mb-4 animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (healthData.length === 0) {
    return (
      <div className={cn("glass-panel p-4 rounded-xl text-center", className)}>
        <Activity size={32} className="text-muted-foreground mx-auto mb-2 opacity-50" />
        <p className="text-sm text-muted-foreground">Keine Gesundheitsdaten vorhanden</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Verbinde ein Wearable um deine Daten zu sehen
        </p>
      </div>
    );
  }

  // Berechne Durchschnitte und Trends
  const today = healthData[healthData.length - 1];
  const lastWeek = healthData.slice(0, -1);
  
  const avgSleep = lastWeek.reduce((sum, d) => sum + (d.sleepScore || 0), 0) / lastWeek.length;
  const avgHRV = lastWeek.reduce((sum, d) => sum + (d.hrvAverage || 0), 0) / lastWeek.length;
  const avgRecovery = lastWeek.reduce((sum, d) => sum + (d.recoveryScore || 0), 0) / lastWeek.length;
  const avgStress = lastWeek.reduce((sum, d) => sum + (d.stressLevel || 0), 0) / lastWeek.length;

  const sleepTrend = today?.sleepScore && avgSleep ? 
    (today.sleepScore > avgSleep + 0.5 ? 'up' : today.sleepScore < avgSleep - 0.5 ? 'down' : 'neutral') : 'neutral';
  const hrvTrend = today?.hrvAverage && avgHRV ? 
    (today.hrvAverage > avgHRV + 3 ? 'up' : today.hrvAverage < avgHRV - 3 ? 'down' : 'neutral') : 'neutral';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-panel p-4 rounded-xl", className)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Heute</h3>
        <span className="text-xs text-muted-foreground font-mono">
          {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Moon size={14} className="text-indigo-400" />}
          label="Schlaf"
          value={today?.sleepScore?.toFixed(1) || '-'}
          unit="/10"
          trend={sleepTrend}
          trendValue={sleepTrend === 'up' ? 'Besser als Ø' : sleepTrend === 'down' ? 'Unter Ø' : 'Im Schnitt'}
          color="bg-indigo-500/20"
        />
        
        <MetricCard
          icon={<Heart size={14} className="text-red-400" />}
          label="HRV"
          value={today?.hrvAverage || '-'}
          unit="ms"
          trend={hrvTrend}
          trendValue={hrvTrend === 'up' ? '+' + Math.round((today?.hrvAverage || 0) - avgHRV) + ' vs Ø' : 
                      hrvTrend === 'down' ? Math.round((today?.hrvAverage || 0) - avgHRV) + ' vs Ø' : 'Stabil'}
          color="bg-red-500/20"
        />
        
        <MetricCard
          icon={<Battery size={14} className="text-green-400" />}
          label="Recovery"
          value={today?.recoveryScore?.toFixed(1) || '-'}
          unit="/10"
          trend={today?.recoveryScore && avgRecovery ? 
            (today.recoveryScore > avgRecovery + 0.5 ? 'up' : today.recoveryScore < avgRecovery - 0.5 ? 'down' : 'neutral') : 'neutral'}
          trendValue={`Ø ${avgRecovery.toFixed(1)}`}
          color="bg-green-500/20"
        />
        
        <MetricCard
          icon={<Brain size={14} className="text-purple-400" />}
          label="Stress"
          value={today?.stressLevel?.toFixed(1) || '-'}
          unit="/10"
          trend={today?.stressLevel && avgStress ? 
            (today.stressLevel < avgStress - 0.5 ? 'up' : today.stressLevel > avgStress + 0.5 ? 'down' : 'neutral') : 'neutral'}
          trendValue={today?.stressLevel && today.stressLevel < avgStress ? 'Niedriger 👍' : 'Höher'}
          color="bg-purple-500/20"
        />
      </div>

      {/* Additional Stats */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-lg font-bold text-foreground">{today?.sleepDurationHours?.toFixed(1) || '-'}h</p>
            <p className="text-[10px] text-muted-foreground">Schlaf</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{today?.restingHeartRate || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Ruhepuls</p>
          </div>
          <div>
            <p className="text-lg font-bold text-foreground">{today?.steps?.toLocaleString() || '-'}</p>
            <p className="text-[10px] text-muted-foreground">Schritte</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

