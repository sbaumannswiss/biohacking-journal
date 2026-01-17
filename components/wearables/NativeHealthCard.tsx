'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart,
  Link2, 
  Loader2, 
  CheckCircle2,
  Download,
  AlertTriangle,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  checkNativeHealthAvailable,
  connectNativeHealth,
  getHealthData,
} from '@/lib/wearables';
import { 
  isNativePlatform, 
  openHealthConnectStore, 
  getPlatform,
  syncAllHealthData 
} from '@/lib/health';

interface NativeHealthCardProps {
  userId: string;
  onConnected?: () => void;
  onDataSynced?: () => void;
}

export function NativeHealthCard({ userId, onConnected, onDataSynced }: NativeHealthCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [platform, setPlatform] = useState<'android' | 'ios' | 'web'>('web');
  const [dataCount, setDataCount] = useState<number>(0);

  useEffect(() => {
    const currentPlatform = getPlatform();
    setPlatform(currentPlatform);

    // Prüfe Verfügbarkeit und Verbindungsstatus
    const checkStatus = async () => {
      const result = await checkNativeHealthAvailable();
      setIsAvailable(result.available);
      
      if (!result.available && currentPlatform === 'android') {
        setNeedsInstall(true);
      }

      // Prüfe ob bereits verbunden
      if (typeof window !== 'undefined') {
        const connections = localStorage.getItem('native_health_connections');
        if (connections) {
          const parsed = JSON.parse(connections);
          const connected = currentPlatform === 'android' 
            ? parsed.healthconnect === true 
            : parsed.apple_health === true;
          setIsConnected(connected);
          if (parsed.lastSync) {
            setLastSync(parsed.lastSync);
          }
        }
      }
    };

    checkStatus();
  }, []);

  const handleConnect = async () => {
    setIsLoading(true);
    
    const result = await connectNativeHealth();
    
    if (result.success) {
      setIsConnected(true);
      setNeedsInstall(false);
      onConnected?.();
      
      // Initial Sync
      await handleSync();
    } else if (result.error?.includes('nicht verfügbar') && platform === 'android') {
      setNeedsInstall(true);
    }
    
    setIsLoading(false);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    
    try {
      const data = await syncAllHealthData(14);
      setDataCount(data.length);
      
      // Speichere Last Sync
      const now = new Date().toISOString();
      setLastSync(now);
      
      if (typeof window !== 'undefined') {
        const connections = JSON.parse(localStorage.getItem('native_health_connections') || '{}');
        connections.lastSync = now;
        localStorage.setItem('native_health_connections', JSON.stringify(connections));
      }
      
      onDataSynced?.();
    } catch (e) {
      console.error('Sync fehlgeschlagen:', e);
    }
    
    setIsSyncing(false);
  };

  const handleInstall = () => {
    openHealthConnectStore();
  };

  const formatLastSync = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'Gerade eben';
    if (diffMinutes < 60) return `Vor ${diffMinutes} Min`;
    if (diffMinutes < 1440) return `Vor ${Math.floor(diffMinutes / 60)} Std`;
    return `Vor ${Math.floor(diffMinutes / 1440)} Tagen`;
  };

  // Web-Fallback
  if (platform === 'web') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl border bg-white/5 border-white/10"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
            <Smartphone size={24} className="text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">Health Tracker</h3>
            <p className="text-xs text-muted-foreground">
              Verbindung nur in der nativen App verfügbar
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  const providerName = platform === 'android' ? 'Health Connect' : 'Apple Health';
  const providerIcon = platform === 'android' ? '💚' : '❤️';
  const providerColor = platform === 'android' ? 'text-green-400' : 'text-red-400';
  const providerBg = platform === 'android' 
    ? 'bg-green-500/10 border-green-500/30' 
    : 'bg-red-500/10 border-red-500/30';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        isConnected ? providerBg : "bg-white/5 border-white/10"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Provider Info */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            isConnected ? "bg-white/10" : "bg-white/5"
          )}>
            {providerIcon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn("font-semibold", providerColor)}>
                {providerName}
              </h3>
              {isConnected && (
                <CheckCircle2 size={14} className="text-green-400" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {platform === 'android' 
                ? 'Garmin, Samsung, Fitbit, Whoop, Oura' 
                : 'Apple Watch, HealthKit-Apps'}
            </p>
            {isConnected && lastSync && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Sync: {formatLastSync(lastSync)} • {dataCount} Tage
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Daten synchronisieren"
            >
              <RefreshCw 
                size={16} 
                className={cn("text-muted-foreground", isSyncing && "animate-spin")} 
              />
            </button>
          ) : needsInstall ? (
            <button
              onClick={handleInstall}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30"
              )}
            >
              <Download size={16} />
              Installieren
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isLoading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                "bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              )}
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Link2 size={16} />
              )}
              Verbinden
            </button>
          )}
        </div>
      </div>

      {/* Install Hint */}
      {needsInstall && (
        <div className="mt-3 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-start gap-2">
            <AlertTriangle size={14} className="text-yellow-400 mt-0.5 shrink-0" />
            <p className="text-xs text-yellow-300/80">
              Health Connect muss installiert sein, um Daten von deinen Trackern zu lesen.
            </p>
          </div>
        </div>
      )}
    </motion.div>
  );
}
