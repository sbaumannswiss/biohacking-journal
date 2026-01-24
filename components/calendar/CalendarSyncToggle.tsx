'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Loader2, AlertCircle, Bell, BellOff } from 'lucide-react';
import { clsx } from 'clsx';
import {
    isCalendarAvailable,
    hasCalendarWritePermission,
    requestAllCalendarPermissions,
    getCalendarSettings,
    saveCalendarSettings,
    syncAllSupplementsToCalendar,
    removeAllCalendarEvents,
    getCalendarSyncState,
} from '@/lib/calendar';
import type { TimeOfDay } from '@/types';

interface SupplementForSync {
    id: string;
    name: string;
    dosage?: string;
    defaultTime: TimeOfDay;
}

interface CalendarSyncToggleProps {
    supplements: SupplementForSync[];
    onSyncComplete?: (success: number, failed: number) => void;
    onSyncDisabled?: () => void;
    className?: string;
    compact?: boolean;
}

export function CalendarSyncToggle({
    supplements,
    onSyncComplete,
    onSyncDisabled,
    className,
    compact = false,
}: CalendarSyncToggleProps) {
    const [isAvailable, setIsAvailable] = useState(false);
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [syncMessage, setSyncMessage] = useState<string | null>(null);
    const [syncedCount, setSyncedCount] = useState(0);

    useEffect(() => {
        // Prüfe ob Kalender verfügbar ist
        const available = isCalendarAvailable();
        setIsAvailable(available);

        if (available) {
            // Lade aktuelle Einstellungen
            const settings = getCalendarSettings();
            setIsEnabled(settings.enabled);

            // Zähle synchronisierte Supplements
            const state = getCalendarSyncState();
            setSyncedCount(state.syncedSupplementIds.length);
        }
    }, []);

    const handleToggle = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setSyncStatus('idle');
        setSyncMessage(null);

        try {
            if (!isEnabled) {
                // Aktivieren: Permissions anfordern und synchronisieren
                const hasPermission = await hasCalendarWritePermission();
                
                if (!hasPermission) {
                    const granted = await requestAllCalendarPermissions();
                    if (!granted) {
                        setSyncStatus('error');
                        setSyncMessage('Kalender-Berechtigung wurde nicht erteilt');
                        setIsLoading(false);
                        return;
                    }
                }

                // Alle Supplements synchronisieren
                const result = await syncAllSupplementsToCalendar(supplements);
                
                setIsEnabled(true);
                setSyncedCount(result.success);
                
                if (result.failed > 0) {
                    setSyncStatus('error');
                    setSyncMessage(`${result.success} synchronisiert, ${result.failed} fehlgeschlagen`);
                } else {
                    setSyncStatus('success');
                    setSyncMessage(`${result.success} Supplements synchronisiert`);
                }
                
                onSyncComplete?.(result.success, result.failed);
            } else {
                // Deaktivieren: Alle Events entfernen
                await removeAllCalendarEvents();
                setIsEnabled(false);
                setSyncedCount(0);
                setSyncStatus('success');
                setSyncMessage('Kalender-Sync deaktiviert');
                onSyncDisabled?.();
            }
        } catch (error) {
            console.error('Calendar sync error:', error);
            setSyncStatus('error');
            setSyncMessage('Ein Fehler ist aufgetreten');
        } finally {
            setIsLoading(false);
            
            // Status nach 3 Sekunden zurücksetzen
            setTimeout(() => {
                setSyncStatus('idle');
                setSyncMessage(null);
            }, 3000);
        }
    };

    // Nicht verfügbar auf Web
    if (!isAvailable) {
        return null;
    }

    if (compact) {
        return (
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={clsx(
                    "p-3 rounded-xl transition-all duration-300 flex items-center justify-center",
                    isEnabled
                        ? "bg-primary/20 text-primary border border-primary/30"
                        : "bg-card/60 text-muted-foreground border border-white/5 hover:border-white/20",
                    isLoading && "opacity-50 cursor-not-allowed",
                    className
                )}
                aria-label={isEnabled ? "Kalender-Sync deaktivieren" : "Kalender-Sync aktivieren"}
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : isEnabled ? (
                    <Bell size={20} />
                ) : (
                    <BellOff size={20} />
                )}
            </button>
        );
    }

    return (
        <div className={clsx("w-full", className)}>
            <button
                onClick={handleToggle}
                disabled={isLoading}
                className={clsx(
                    "w-full p-4 rounded-2xl transition-all duration-300 border",
                    isEnabled
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card/60 border-white/5 hover:border-white/20 hover:bg-card/80",
                    isLoading && "opacity-70 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={clsx(
                        "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                        isEnabled ? "bg-primary/20 text-primary" : "bg-white/5 text-muted-foreground"
                    )}>
                        {isLoading ? (
                            <Loader2 size={24} className="animate-spin" />
                        ) : (
                            <Calendar size={24} />
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-left">
                        <div className="font-semibold text-foreground flex items-center gap-2">
                            Kalender-Erinnerungen
                            {isEnabled && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-primary/20 text-primary">
                                    Aktiv
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {isEnabled
                                ? `${syncedCount} Supplements im Kalender`
                                : "Supplement-Erinnerungen im Kalender"}
                        </p>
                    </div>

                    {/* Toggle Indicator */}
                    <div className={clsx(
                        "w-14 h-8 rounded-full p-1 transition-colors",
                        isEnabled ? "bg-primary" : "bg-white/10"
                    )}>
                        <motion.div
                            className="w-6 h-6 rounded-full bg-white shadow-md"
                            animate={{ x: isEnabled ? 24 : 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        />
                    </div>
                </div>
            </button>

            {/* Status Message */}
            <AnimatePresence>
                {syncMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={clsx(
                            "mt-2 px-4 py-2 rounded-xl text-sm flex items-center gap-2",
                            syncStatus === 'success'
                                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                                : "bg-red-500/10 text-red-400 border border-red-500/20"
                        )}
                    >
                        {syncStatus === 'success' ? (
                            <Check size={16} />
                        ) : (
                            <AlertCircle size={16} />
                        )}
                        {syncMessage}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
