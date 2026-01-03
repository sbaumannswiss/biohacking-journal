'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { clsx } from 'clsx';
import { logCheckIn } from '@/lib/supabaseService';
import { getAnonymousUserId } from '@/hooks/useAnonymousUser';

interface CheckInButtonProps {
    supplementId: string;
    supplementName: string;
    dosage: string;
    emoji?: string;
    isCompleted?: boolean;
    onCheckIn?: () => void;
}

export function CheckInButton({ 
    supplementId, 
    supplementName, 
    dosage, 
    emoji,
    isCompleted = false,
    onCheckIn 
}: CheckInButtonProps) {
    const [isChecked, setIsChecked] = useState(isCompleted);
    const [isLoading, setIsLoading] = useState(false);

    // Sync with external isCompleted prop
    useEffect(() => {
        setIsChecked(isCompleted);
    }, [isCompleted]);

    const handleCheckIn = async () => {
        if (isChecked || isLoading) return;

        // Haptic Feedback (Web API)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate([30, 20, 30]);
        }

        setIsLoading(true);

        try {
            // Optimistic Update
            setIsChecked(true);

            // Trigger animation/parent update immediately for better feel
            onCheckIn?.();

            // Log to Supabase via Service
            const userId = getAnonymousUserId();
            const result = await logCheckIn(userId, supplementId, 50);

            if (!result.success) {
                console.error("Check-in Error:", result.error);
                // Bei "bereits heute eingecheckt" trotzdem als erledigt anzeigen
                if (!result.error?.includes('bereits')) {
                    setIsChecked(false);
                }
            }

        } catch (e) {
            console.error(e);
            setIsChecked(false);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            type="button"
            onClick={handleCheckIn}
            disabled={isChecked || isLoading}
            className={clsx(
                "w-full p-4 rounded-2xl flex items-center gap-4 transition-all duration-300 border relative group",
                isChecked
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card/60 border-white/5 hover:border-white/20 hover:bg-card/80",
                !isChecked && "active:scale-[0.98]"
            )}
        >
            {/* Checkbox Ring */}
            <div className={clsx(
                "w-11 h-11 rounded-full border-2 flex items-center justify-center transition-all duration-300 flex-shrink-0",
                isChecked 
                    ? "bg-primary border-primary" 
                    : "border-white/20 bg-transparent group-hover:border-primary/50"
            )}>
                {isChecked ? (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                    >
                        <Check size={22} strokeWidth={3} className="text-primary-foreground" />
                    </motion.div>
                ) : (
                    <motion.div
                        className="w-5 h-5 rounded-full bg-white/5 group-hover:bg-primary/20 transition-colors"
                        whileHover={{ scale: 1.1 }}
                    />
                )}
            </div>

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
                <span className="text-xs text-muted-foreground">{dosage}</span>
            </div>

            {/* Completed Badge */}
            {isChecked && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-bold text-primary uppercase tracking-wider"
                >
                    ✓ Done
                </motion.div>
            )}
        </button>
    );
}
