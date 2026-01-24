'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, X, Check, Sunrise, Sun, Sunset, Moon } from 'lucide-react';
import { clsx } from 'clsx';
import {
    getCalendarSettings,
    updateCustomTime,
    DEFAULT_CALENDAR_TIMES,
} from '@/lib/calendar';
import type { CalendarTimeSlot } from '@/lib/calendar';
import type { TimeOfDay } from '@/types';

interface TimeCustomizerProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
}

const TIME_SLOTS: { id: TimeOfDay; label: string; icon: typeof Sunrise }[] = [
    { id: 'morning', label: 'Morgens', icon: Sunrise },
    { id: 'noon', label: 'Mittags', icon: Sun },
    { id: 'evening', label: 'Abends', icon: Sunset },
    { id: 'bedtime', label: 'Schlafenszeit', icon: Moon },
];

function formatTime(slot: CalendarTimeSlot): string {
    return `${slot.hour.toString().padStart(2, '0')}:${slot.minute.toString().padStart(2, '0')}`;
}

function parseTime(timeStr: string): CalendarTimeSlot {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return { hour: hours || 0, minute: minutes || 0 };
}

export function TimeCustomizer({ isOpen, onClose, onSave }: TimeCustomizerProps) {
    const [times, setTimes] = useState<Record<TimeOfDay, CalendarTimeSlot>>(DEFAULT_CALENDAR_TIMES);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const settings = getCalendarSettings();
            setTimes(settings.customTimes);
            setHasChanges(false);
        }
    }, [isOpen]);

    const handleTimeChange = (slot: TimeOfDay, value: string) => {
        const newTime = parseTime(value);
        setTimes(prev => ({ ...prev, [slot]: newTime }));
        setHasChanges(true);
    };

    const handleSave = () => {
        // Alle Zeiten speichern
        for (const slot of TIME_SLOTS) {
            updateCustomTime(slot.id, times[slot.id]);
        }
        
        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([50]);
        }
        
        onSave?.();
        onClose();
    };

    const handleReset = () => {
        setTimes(DEFAULT_CALENDAR_TIMES);
        setHasChanges(true);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: '100%', opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: '100%', opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl border border-white/10 shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        Erinnerungszeiten
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        Passe die Standardzeiten an
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-white/5 transition-colors"
                                aria-label="Schließen"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Time Slots */}
                        <div className="p-4 space-y-3">
                            {TIME_SLOTS.map((slot) => {
                                const Icon = slot.icon;
                                return (
                                    <div
                                        key={slot.id}
                                        className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <div className={clsx(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            slot.id === 'morning' && "bg-orange-500/20 text-orange-400",
                                            slot.id === 'noon' && "bg-yellow-500/20 text-yellow-400",
                                            slot.id === 'evening' && "bg-purple-500/20 text-purple-400",
                                            slot.id === 'bedtime' && "bg-blue-500/20 text-blue-400"
                                        )}>
                                            <Icon size={20} />
                                        </div>
                                        
                                        <div className="flex-1">
                                            <span className="font-medium text-foreground">
                                                {slot.label}
                                            </span>
                                        </div>

                                        <input
                                            type="time"
                                            value={formatTime(times[slot.id])}
                                            onChange={(e) => handleTimeChange(slot.id, e.target.value)}
                                            className={clsx(
                                                "px-3 py-2 rounded-lg bg-white/5 border border-white/10",
                                                "text-foreground font-mono text-sm",
                                                "focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
                                                "transition-colors"
                                            )}
                                        />
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 flex gap-3">
                            <button
                                onClick={handleReset}
                                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:bg-white/10 transition-colors text-sm"
                            >
                                Zurücksetzen
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={clsx(
                                    "flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                                    hasChanges
                                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                        : "bg-white/5 text-muted-foreground cursor-not-allowed"
                                )}
                            >
                                <Check size={18} />
                                Speichern
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * Kompakter Button zum Öffnen des TimeCustomizers
 */
interface TimeCustomizerButtonProps {
    onClick: () => void;
    className?: string;
}

export function TimeCustomizerButton({ onClick, className }: TimeCustomizerButtonProps) {
    const [times, setTimes] = useState<Record<TimeOfDay, CalendarTimeSlot>>(DEFAULT_CALENDAR_TIMES);

    useEffect(() => {
        const settings = getCalendarSettings();
        setTimes(settings.customTimes);
    }, []);

    return (
        <button
            onClick={onClick}
            className={clsx(
                "w-full p-4 rounded-2xl bg-card/60 border border-white/5",
                "hover:border-white/20 hover:bg-card/80 transition-all",
                className
            )}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-muted-foreground">
                    <Clock size={24} />
                </div>
                <div className="flex-1 text-left">
                    <div className="font-semibold text-foreground">
                        Erinnerungszeiten
                    </div>
                    <div className="text-sm text-muted-foreground flex gap-2">
                        {TIME_SLOTS.slice(0, 2).map((slot) => (
                            <span key={slot.id}>
                                {slot.label}: {formatTime(times[slot.id])}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="text-muted-foreground">
                    <Clock size={20} />
                </div>
            </div>
        </button>
    );
}
