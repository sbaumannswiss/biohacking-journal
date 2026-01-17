'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Watch, 
  Link2, 
  Unlink, 
  Loader2, 
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Smartphone,
  Download
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  WearableProvider, 
  mockConnectProvider, 
  mockDisconnectProvider,
  USE_MOCK_DATA,
  checkNativeHealthAvailable,
  connectNativeHealth,
} from '@/lib/wearables';
import { isNativePlatform, openHealthConnectStore, getPlatform } from '@/lib/health';

interface WearableConnectCardProps {
  provider: WearableProvider;
  isConnected: boolean;
  lastSync?: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  onSync?: () => void;
  userId: string;
}

const PROVIDER_INFO: Record<WearableProvider, {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  healthconnect: {
    name: 'Health Connect',
    icon: '💚',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10 border-green-500/30',
    description: 'Garmin, Samsung, Fitbit, Whoop, Oura & mehr',
  },
  apple_health: {
    name: 'Apple Health',
    icon: '❤️',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    description: 'Apple Watch, alle HealthKit-Apps',
  },
  garmin: {
    name: 'Garmin',
    icon: '⌚',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    description: 'Connect, Fenix, Forerunner, Venu',
  },
  whoop: {
    name: 'WHOOP',
    icon: '💪',
    color: 'text-red-400',
    bgColor: 'bg-red-500/10 border-red-500/30',
    description: 'WHOOP 4.0, 5.0',
  },
  oura: {
    name: 'Oura Ring',
    icon: '💍',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Oura Ring Gen 2, Gen 3',
  },
  apple: {
    name: 'Apple Health',
    icon: '🍎',
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/10 border-pink-500/30',
    description: 'Apple Watch, iPhone',
  },
  samsung: {
    name: 'Samsung Health',
    icon: '📱',
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/10 border-cyan-500/30',
    description: 'Galaxy Watch, Galaxy Phone',
  },
};

export function WearableConnectCard({
  provider,
  isConnected,
  lastSync,
  onConnect,
  onDisconnect,
  onSync,
  userId,
}: WearableConnectCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState<boolean | null>(null);
  const [needsInstall, setNeedsInstall] = useState(false);
  
  const info = PROVIDER_INFO[provider];

  // Prüfe Health Connect Verfügbarkeit bei Native-Providern
  useEffect(() => {
    if (provider === 'healthconnect' || provider === 'apple_health') {
      checkNativeHealthAvailable().then(result => {
        setHealthConnectAvailable(result.available);
        if (!result.available && getPlatform() === 'android') {
          setNeedsInstall(true);
        }
      });
    }
  }, [provider]);

  const handleConnect = async () => {
    setIsLoading(true);
    
    // Native Health APIs (Health Connect / HealthKit)
    if (provider === 'healthconnect' || provider === 'apple_health') {
      const result = await connectNativeHealth();
      if (result.success) {
        onConnect();
      } else if (result.error?.includes('nicht verfügbar') && getPlatform() === 'android') {
        setNeedsInstall(true);
      }
      setIsLoading(false);
      return;
    }
    
    if (USE_MOCK_DATA) {
      // Mock-Verbindung simulieren
      await new Promise(resolve => setTimeout(resolve, 1500));
      mockConnectProvider(provider);
      onConnect();
    } else {
      // Echte OAuth-Verbindung
      window.location.href = `/api/${provider}/auth?user_id=${userId}`;
    }
    
    setIsLoading(false);
  };

  const handleInstallHealthConnect = () => {
    openHealthConnectStore();
  };

  const handleDisconnect = async () => {
    setIsLoading(true);
    
    if (USE_MOCK_DATA) {
      await new Promise(resolve => setTimeout(resolve, 500));
      mockDisconnectProvider(provider);
    }
    
    onDisconnect();
    setShowConfirmDisconnect(false);
    setIsLoading(false);
  };

  const handleSync = async () => {
    if (!onSync) return;
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    onSync();
    setIsLoading(false);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative p-4 rounded-xl border transition-all",
        isConnected ? info.bgColor : "bg-white/5 border-white/10"
      )}
    >
      <div className="flex items-center justify-between">
        {/* Provider Info */}
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center text-2xl",
            isConnected ? "bg-white/10" : "bg-white/5"
          )}>
            {info.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn("font-semibold", info.color)}>
                {info.name}
              </h3>
              {isConnected && (
                <CheckCircle2 size={14} className="text-green-400" />
              )}
              {USE_MOCK_DATA && isConnected && (
                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 py-0.5 rounded">
                  DEMO
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{info.description}</p>
            {isConnected && lastSync && (
              <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                Sync: {formatLastSync(lastSync)}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              {onSync && (
                <button
                  onClick={handleSync}
                  disabled={isLoading}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  title="Daten synchronisieren"
                >
                  <RefreshCw 
                    size={16} 
                    className={cn("text-muted-foreground", isLoading && "animate-spin")} 
                  />
                </button>
              )}
              <button
                onClick={() => setShowConfirmDisconnect(true)}
                disabled={isLoading}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                title="Verbindung trennen"
              >
                <Unlink size={16} className="text-red-400" />
              </button>
            </>
          ) : needsInstall ? (
            <button
              onClick={handleInstallHealthConnect}
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

      {/* Disconnect Confirmation Modal */}
      <AnimatePresence>
        {showConfirmDisconnect && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm rounded-xl flex items-center justify-center p-4 z-10"
          >
            <div className="text-center">
              <AlertCircle size={24} className="text-red-400 mx-auto mb-2" />
              <p className="text-sm text-foreground mb-3">
                {info.name} trennen?
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setShowConfirmDisconnect(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/10 text-sm hover:bg-white/20"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 flex items-center gap-1"
                >
                  {isLoading && <Loader2 size={12} className="animate-spin" />}
                  Trennen
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

