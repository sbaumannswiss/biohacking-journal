'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Check, Pill, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DosageModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (dosage: string, time?: string) => void;
    supplementName: string;
    supplementEmoji?: string;
    defaultDosage: string;
    defaultTime?: string;
    mode: 'add' | 'edit';
}

const TIME_OPTIONS = [
    { value: 'morning', label: 'Morning', emoji: '☀️' },
    { value: 'noon', label: 'Noon', emoji: '🌤️' },
    { value: 'evening', label: 'Evening', emoji: '🌅' },
    { value: 'bedtime', label: 'Bedtime', emoji: '🌙' },
];

const ALL_UNITS = ['mg', 'g', 'ml', 'IU', 'mcg', 'Kapseln', 'Tabletten', 'Tropfen'];

// Parse dosage into amount and unit
function parseDosage(dosageStr: string): { amount: string; unit: string } {
    // Match patterns like "500mg", "100-200 mg", "2 Kapseln", "5g täglich"
    const match = dosageStr.match(/^([\d.,\-–]+)\s*([a-zA-ZäöüÄÖÜ]+)?/);
    if (match) {
        const amount = match[1] || '';
        const unitRaw = match[2]?.toLowerCase() || '';
        // Find matching unit from our list
        const unit = ALL_UNITS.find(u => u.toLowerCase() === unitRaw) || 
                     ALL_UNITS.find(u => unitRaw.startsWith(u.toLowerCase())) || 
                     'mg';
        return { amount, unit };
    }
    return { amount: '', unit: 'mg' };
}

export function DosageModal({
    isOpen,
    onClose,
    onSave,
    supplementName,
    supplementEmoji,
    defaultDosage,
    defaultTime,
    mode,
}: DosageModalProps) {
    const parsed = parseDosage(defaultDosage);
    const [amount, setAmount] = useState(parsed.amount);
    const [unit, setUnit] = useState(parsed.unit);
    const [selectedTime, setSelectedTime] = useState<string | undefined>(defaultTime);
    const inputRef = useRef<HTMLInputElement>(null);

    // Reset when modal opens with new supplement
    useEffect(() => {
        if (isOpen) {
            const parsed = parseDosage(defaultDosage);
            setAmount(parsed.amount);
            setUnit(parsed.unit);
            setSelectedTime(defaultTime);
            // Focus input after modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, defaultDosage, defaultTime]);

    const handleSave = () => {
        // Combine amount + unit, or use default if empty
        const finalDosage = amount.trim() ? `${amount.trim()} ${unit}` : defaultDosage;
        onSave(finalDosage, selectedTime);
        onClose();
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking directly on backdrop, not children
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    onClick={handleBackdropClick}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.95, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        className="w-full max-w-md glass-panel rounded-2xl p-6 border border-white/10 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                {supplementEmoji && (
                                    <span className="text-3xl">{supplementEmoji}</span>
                                )}
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">
                                        {mode === 'add' ? 'Zum Stack hinzufügen' : 'Dosierung bearbeiten'}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">{supplementName}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Dosage Input - Menge + Einheit separat */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                <Pill size={16} />
                                Dosierung
                            </label>
                            <div className="flex gap-2">
                                {/* Amount Input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    inputMode="decimal"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Menge"
                                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground text-lg font-mono text-center placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
                                />
                                
                                {/* Unit Dropdown */}
                                <select
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-28 px-2 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground font-medium focus:outline-none focus:border-primary/50 transition-all cursor-pointer text-center"
                                >
                                    {ALL_UNITS.map((u) => (
                                        <option key={u} value={u} className="bg-background text-foreground">
                                            {u}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                                Standard: {defaultDosage}
                            </p>
                        </div>

                        {/* Time Selection (Optional) */}
                        <div className="mb-6">
                            <label className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                                <Clock size={16} />
                                Einnahmezeit (optional)
                            </label>
                            <div className="flex gap-2">
                                {TIME_OPTIONS.map((option) => (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() => setSelectedTime(
                                            selectedTime === option.value ? undefined : option.value
                                        )}
                                        className={cn(
                                            "flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1",
                                            selectedTime === option.value
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        <span>{option.emoji}</span>
                                        <span>{option.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3.5 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
                            >
                                Abbrechen
                            </button>
                            <button
                                type="button"
                                onClick={handleSave}
                                className="flex-1 py-3.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                            >
                                <Check size={18} strokeWidth={2.5} />
                                {mode === 'add' ? 'Hinzufügen' : 'Speichern'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

