'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Trash2, Loader2, AlertTriangle, Pencil } from 'lucide-react';
import { clsx } from 'clsx';
import { logCheckIn, removeFromStack, undoCheckIn, updateStackItem } from '@/lib/supabaseService';
import { getAnonymousUserId } from '@/hooks/useAnonymousUser';
import { DosageModal } from '@/components/ui/DosageModal';

interface StackItemCardProps {
    supplementId: string;
    supplementName: string;
    dosage: string;
    emoji?: string;
    isCompleted?: boolean;
    defaultTime?: string;
    onCheckIn?: () => void;
    onUndoCheckIn?: () => void;
    onRemove?: () => void;
    onDosageUpdate?: (newDosage: string, newTime?: string) => void;
}

export function StackItemCard({ 
    supplementId, 
    supplementName, 
    dosage, 
    emoji,
    isCompleted = false,
    defaultTime,
    onCheckIn,
    onUndoCheckIn,
    onRemove,
    onDosageUpdate
}: StackItemCardProps) {
    const [isChecked, setIsChecked] = useState(isCompleted);
    const [isLoading, setIsLoading] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showDosageModal, setShowDosageModal] = useState(false);
    const [currentDosage, setCurrentDosage] = useState(dosage);

    // Sync with external isCompleted prop
    useEffect(() => {
        setIsChecked(isCompleted);
    }, [isCompleted]);

    const handleCheckIn = async () => {
        if (isLoading || isRemoving) return;

        // Wenn bereits gecheckt, dann undo
        if (isChecked) {
            setIsLoading(true);
            
            // Haptic Feedback
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
                navigator.vibrate([30, 20, 30]);
            }

            try {
                const userId = getAnonymousUserId();
                const result = await undoCheckIn(userId, supplementId);

                if (result.success) {
                    setIsChecked(false);
                    onUndoCheckIn?.();
                } else {
                    console.error('Undo check-in failed:', result.error);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // Normaler Check-In
        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 20, 30]);
        }

        setIsLoading(true);

        try {
            setIsChecked(true);
            onCheckIn?.();

            const userId = getAnonymousUserId();
            const result = await logCheckIn(userId, supplementId, 50);

            if (!result.success && !result.error?.includes('bereits')) {
                setIsChecked(false);
            }
        } catch (e) {
            console.error(e);
            setIsChecked(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async () => {
        if (isRemoving) return;
        
        setShowConfirmDelete(false);
        setIsRemoving(true);
        
        // Haptic Feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([100]);
        }

        try {
            const userId = getAnonymousUserId();
            const result = await removeFromStack(userId, supplementId);
            
            if (result.success) {
                onRemove?.();
            } else {
                console.error('Remove failed:', result.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsRemoving(false);
        }
    };

    return (
        <div className="relative">
            <div
                className={clsx(
                    "w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border relative group",
                    isChecked
                        ? "bg-primary/10 border-primary/30"
                        : "bg-card/60 border-white/5 hover:border-white/20 hover:bg-card/80"
                )}
            >
                {/* Checkbox Ring - Clickable */}
                <button
                    type="button"
                    onClick={handleCheckIn}
                    disabled={isLoading || isRemoving}
                    aria-label={isChecked ? `${supplementName} rückgängig machen` : `${supplementName} als genommen markieren`}
                    aria-pressed={isChecked}
                    className={clsx(
                        "w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0 cursor-pointer",
                        isChecked 
                            ? "bg-primary border-primary hover:bg-primary/90" 
                            : "border-white/20 bg-transparent hover:border-primary/50 hover:bg-primary/10",
                        "active:scale-95"
                    )}
                >
                    {isLoading ? (
                        <Loader2 size={18} className="animate-spin text-primary" aria-hidden="true" />
                    ) : isChecked ? (
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        >
                            <Check size={22} strokeWidth={3} className="text-primary-foreground" aria-hidden="true" />
                        </motion.div>
                    ) : (
                        <motion.div
                            className="w-5 h-5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            aria-hidden="true"
                        />
                    )}
                </button>

                {/* Content */}
                <div className="flex-1 text-left">
                    <div className="flex items-center gap-2">
                        {emoji && <span className="text-lg">{emoji}</span>}
                        <span className={clsx(
                            "font-semibold transition-colors duration-300",
                            isChecked ? "text-primary" : "text-foreground"
                        )}>
                            {supplementName}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowDosageModal(true)}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                        {currentDosage}
                        <Pencil size={10} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>

                {/* Remove Button (small icon) */}
                <button
                    type="button"
                    onClick={() => setShowConfirmDelete(true)}
                    disabled={isRemoving}
                    aria-label={`${supplementName} aus Stack entfernen`}
                    className="ml-2 p-2 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                    <Trash2 size={16} aria-hidden="true" />
                </button>
            </div>

            {/* Dosage Edit Modal */}
            <DosageModal
                isOpen={showDosageModal}
                onClose={() => setShowDosageModal(false)}
                onSave={async (newDosage, newTime) => {
                    const userId = getAnonymousUserId();
                    const result = await updateStackItem(userId, supplementId, {
                        custom_dosage: newDosage,
                        custom_time: newTime
                    });
                    
                    if (result.success) {
                        setCurrentDosage(newDosage);
                        onDosageUpdate?.(newDosage, newTime);
                        
                        // Haptic Feedback
                        if (typeof navigator !== 'undefined' && navigator.vibrate) {
                            navigator.vibrate([50]);
                        }
                    }
                }}
                supplementName={supplementName}
                supplementEmoji={emoji}
                defaultDosage={currentDosage}
                defaultTime={defaultTime}
                mode="edit"
            />

            {/* Bestätigungs-Dialog */}
            <AnimatePresence>
                {showConfirmDelete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                        onClick={() => setShowConfirmDelete(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            className="w-full max-w-sm glass-panel rounded-2xl p-6 border border-red-500/30 shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4 text-red-400">
                                    <AlertTriangle size={32} />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">
                                    Aus Stack entfernen?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    {supplementName} wird aus deinem Stack entfernt.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 rounded-xl font-medium text-foreground hover:bg-white/10 transition-colors"
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleRemove}
                                    disabled={isRemoving}
                                    className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isRemoving ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            Entfernen...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 size={18} />
                                            Entfernen
                                        </>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

