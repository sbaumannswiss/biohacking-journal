
'use client';

import { motion } from 'framer-motion';
import { useRef, useState, useMemo } from 'react';

interface MetricSliderProps {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min?: number;
    max?: number;
    icon?: React.ReactNode;
}

// Mint-Töne basierend auf Wert (heller → satter)
const getMintColor = (percent: number) => {
    if (percent <= 25) return { 
        fill: 'from-primary/20 to-primary/10', 
        glow: 'rgba(167,243,208,0.3)', 
        dot: 'bg-primary/60' 
    };
    if (percent <= 50) return { 
        fill: 'from-primary/30 to-primary/15', 
        glow: 'rgba(167,243,208,0.5)', 
        dot: 'bg-primary/75' 
    };
    if (percent <= 75) return { 
        fill: 'from-primary/40 to-primary/20', 
        glow: 'rgba(167,243,208,0.6)', 
        dot: 'bg-primary/90' 
    };
    return { 
        fill: 'from-primary/50 to-primary/25', 
        glow: 'rgba(167,243,208,0.8)', 
        dot: 'bg-primary' 
    };
};

export function MetricSlider({ 
    label, 
    value, 
    onChange, 
    min = 1, 
    max = 10, 
    icon,
}: MetricSliderProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleInteraction = (clientX: number) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const offsetX = Math.max(0, Math.min(clientX - rect.left, rect.width));
        const percentage = offsetX / rect.width;
        const rawValue = min + (max - min) * percentage;
        const newValue = Math.max(min, Math.min(max, Math.round(rawValue)));
        
        // Nur updaten wenn sich der Wert ändert
        if (newValue !== value) {
            onChange(newValue);
            
            // Haptic feedback - stärker bei hohen Werten
            if (navigator.vibrate) {
                const intensity = Math.floor(newValue / 3) * 5 + 5;
                navigator.vibrate(intensity);
            }
            
            // Extra Haptic bei Max (10/10)
            if (newValue === max && value !== max) {
                if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
            }
        }
    };

    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        handleInteraction(e.clientX);
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    // Berechne Prozent (0-100) basierend auf aktuellem Wert
    const fillPercent = ((value - min) / (max - min)) * 100;
    const colors = useMemo(() => getMintColor(fillPercent), [fillPercent]);

    return (
        <div className="w-full mb-4 px-2">
            <div className="flex justify-between items-end mb-2">
                <div className="flex items-center gap-2 text-foreground text-sm font-medium">
                    {icon && <span className="text-primary">{icon}</span>}
                    {label}
                </div>
                <motion.div 
                    className="font-mono font-bold text-primary"
                    animate={{ scale: isDragging ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                >
                    {value}<span className="text-xs text-muted-foreground font-normal">/{max}</span>
                </motion.div>
            </div>

            {/* Slider Container */}
            <div 
                ref={containerRef}
                className="relative h-9 cursor-pointer touch-none select-none"
                onPointerDown={handlePointerDown}
                onPointerMove={(e) => {
                    if (e.buttons === 1) handleInteraction(e.clientX);
                }}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
            >
                {/* Track mit overflow-hidden für Effekte */}
                <motion.div 
                    className="absolute inset-0 bg-muted/50 dark:bg-white/5 border border-border rounded-xl overflow-hidden"
                    animate={{ 
                        scale: isDragging ? 1.01 : 1,
                        borderColor: value === max 
                            ? 'rgba(167,243,208,0.5)' 
                            : isDragging 
                                ? 'rgba(167,243,208,0.3)' 
                                : undefined,
                    }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 400, 
                        damping: 25,
                    }}
                >
                    {/* Fill Gradient */}
                    <motion.div 
                        className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colors.fill} rounded-l-xl`}
                        initial={false}
                        animate={{ width: `${fillPercent}%` }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                    
                    {/* Shimmer Effect beim Draggen */}
                    {isDragging && (
                        <motion.div
                            className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                        />
                    )}

                    {/* Pulsierender Effekt bei 10/10 - füllt die ganze Leiste */}
                    {value === max && (
                        <motion.div
                            className="absolute inset-0 rounded-xl bg-primary"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0.3, 0.5, 0.3] }}
                            transition={{ 
                                duration: 1.5, 
                                repeat: Infinity, 
                                ease: 'easeInOut' 
                            }}
                        />
                    )}

                    {/* Tick Marks - positioniert an den exakten Werten */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
                        {Array.from({ length: max - min - 1 }).map((_, i) => {
                            const tickValue = min + i + 1;
                            const tickPercent = ((tickValue - min) / (max - min)) * 100;
                            const isActive = value >= tickValue;
                            return (
                                <motion.div 
                                    key={i} 
                                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2.5 rounded-full"
                                    style={{ left: `${tickPercent}%` }}
                                    animate={{
                                        backgroundColor: isActive ? 'rgba(20,184,166,0.5)' : 'rgba(128,128,128,0.2)',
                                        scaleY: isActive ? 1.1 : 1,
                                    }}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            );
                        })}
                    </div>
                </motion.div>

                {/* Indicator Dot - verschwindet bei 10/10 */}
                {value < max && (
                    <motion.div
                        className={`absolute top-1/2 w-5 h-5 ${colors.dot} rounded-full z-20 pointer-events-none`}
                        style={{ 
                            boxShadow: `0 0 10px ${colors.glow}`,
                            x: '-50%',
                            y: '-50%'
                        }}
                        initial={false}
                        animate={{ 
                            left: `${fillPercent}%`,
                            scale: isDragging ? 1.15 : 1,
                        }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25,
                        }}
                    />
                )}
            </div>
        </div>
    );
}
