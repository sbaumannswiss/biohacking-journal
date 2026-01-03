'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Sun, 
  Coffee, 
  Sunset, 
  Moon, 
  Clock,
  Zap,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChronoStackSettings, getChronoStackSettings } from '@/lib/wearables';

interface ChronoStackDisplayProps {
  userId: string;
  className?: string;
}

interface TimeWindow {
  id: string;
  label: string;
  icon: React.ReactNode;
  start: string;
  end: string;
  color: string;
  bgColor: string;
  supplements: string[];
}

export function ChronoStackDisplay({ userId, className }: ChronoStackDisplayProps) {
  const [settings, setSettings] = useState<ChronoStackSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWindow, setCurrentWindow] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      const data = await getChronoStackSettings(userId);
      setSettings(data);
      setIsLoading(false);
      
      // Aktuelles Fenster bestimmen
      const now = new Date();
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      
      const parseTime = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
      };
      
      if (data) {
        if (currentMinutes >= parseTime(data.morningWindowStart) && currentMinutes < parseTime(data.morningWindowEnd)) {
          setCurrentWindow('morning');
        } else if (currentMinutes >= parseTime(data.noonWindowStart) && currentMinutes < parseTime(data.noonWindowEnd)) {
          setCurrentWindow('noon');
        } else if (currentMinutes >= parseTime(data.eveningWindowStart) && currentMinutes < parseTime(data.eveningWindowEnd)) {
          setCurrentWindow('evening');
        } else if (currentMinutes >= parseTime(data.bedtimeWindowStart) || currentMinutes < parseTime(data.morningWindowStart)) {
          setCurrentWindow('bedtime');
        }
      }
    }
    
    loadSettings();
  }, [userId]);

  if (isLoading || !settings) {
    return (
      <div className={cn("glass-panel p-4 rounded-xl animate-pulse", className)}>
        <div className="h-6 w-48 bg-white/10 rounded mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const timeWindows: TimeWindow[] = [
    {
      id: 'morning',
      label: 'Morning',
      icon: <Sun size={18} />,
      start: settings.morningWindowStart,
      end: settings.morningWindowEnd,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/30',
      supplements: ['Vitamin D3', 'Omega-3', 'Creatine'],
    },
    {
      id: 'noon',
      label: 'Noon',
      icon: <Coffee size={18} />,
      start: settings.noonWindowStart,
      end: settings.noonWindowEnd,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      supplements: ['B-Komplex', 'Probiotika'],
    },
    {
      id: 'evening',
      label: 'Evening',
      icon: <Sunset size={18} />,
      start: settings.eveningWindowStart,
      end: settings.eveningWindowEnd,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 border-orange-500/30',
      supplements: ['Ashwagandha', 'Curcumin'],
    },
    {
      id: 'bedtime',
      label: 'Bedtime',
      icon: <Moon size={18} />,
      start: settings.bedtimeWindowStart,
      end: settings.bedtimeWindowEnd,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/30',
      supplements: ['Magnesium', 'Glycin', 'L-Theanin'],
    },
  ];

  return (
    <div className={cn("glass-panel p-4 rounded-xl", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/20">
            <Clock size={18} className="text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Chrono-Stack</h3>
            <p className="text-xs text-muted-foreground">
              Basierend auf deinem Biorhythmus
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
          <span>via</span>
          <span className="text-primary font-medium">
            {settings.dataSource === 'manual' ? 'Manuell' : settings.dataSource.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Sleep/Wake Times */}
      <div className="flex items-center justify-center gap-6 mb-4 p-3 bg-white/5 rounded-lg">
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Aufwachen</p>
          <p className="text-lg font-mono font-bold text-foreground">{settings.avgWakeTime}</p>
        </div>
        <div className="h-8 w-px bg-white/10" />
        <div className="text-center">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Schlafen</p>
          <p className="text-lg font-mono font-bold text-foreground">{settings.avgSleepTime}</p>
        </div>
      </div>

      {/* Time Windows */}
      <div className="space-y-2">
        {timeWindows.map((window, index) => (
          <motion.div
            key={window.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "relative p-3 rounded-lg border transition-all",
              currentWindow === window.id
                ? window.bgColor + " ring-1 ring-white/20"
                : "bg-white/5 border-white/10"
            )}
          >
            {/* Current Window Indicator */}
            {currentWindow === window.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -left-1 top-1/2 -translate-y-1/2"
              >
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </motion.div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-white/10", window.color)}>
                  {window.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={cn("font-medium", window.color)}>
                      {window.label}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {window.start} - {window.end}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {window.supplements.join(', ')}
                  </p>
                </div>
              </div>
              
              {currentWindow === window.id && (
                <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">
                  JETZT
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Caffeine Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-400" />
          <span className="text-xs text-yellow-400">
            Letztes Koffein bis <span className="font-mono font-bold">{settings.lastCaffeineTime}</span>
          </span>
        </div>
      </motion.div>

      {/* AI Hint */}
      <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground/60">
        <Sparkles size={10} className="text-primary" />
        <span>Helix passt diese Zeiten automatisch an deine Schlafdaten an</span>
      </div>
    </div>
  );
}

