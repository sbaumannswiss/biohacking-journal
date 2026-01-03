'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useHelix } from './HelixProvider';
import { X } from 'lucide-react';
import { useMemo } from 'react';

interface HelixAvatarProps {
    size?: 'sm' | 'md' | 'lg';
    showMessage?: boolean;
    className?: string;
}

// Animation Variants für verschiedene Moods - Container
const containerVariants = {
    idle: {
        rotate: [0, 2, -2, 0],
        scale: 1,
        transition: { 
            duration: 6, 
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    },
    happy: {
        rotate: [0, 3, -3, 0],
        scale: [1, 1.03, 1],
        transition: { 
            duration: 3, 
            repeat: Infinity,
            ease: "easeInOut" as const
        }
    },
    excited: {
        rotate: [0, 5, -5, 3, -3, 0],
        scale: [1, 1.08, 1, 1.05, 1],
        transition: { 
            duration: 1,
            repeat: Infinity,
            ease: "easeOut" as const
        }
    },
    thinking: {
        rotate: [-3, 3],
        scale: 1,
        transition: { 
            duration: 2.5, 
            repeat: Infinity,
            repeatType: "reverse" as const,
            ease: "easeInOut" as const
        }
    },
    sad: {
        rotate: 0,
        scale: 0.95,
        y: 3,
        transition: { duration: 0.5 }
    }
};

const glowVariants = {
    idle: {
        opacity: [0.3, 0.5, 0.3],
        scale: [1, 1.1, 1],
        transition: { duration: 3, repeat: Infinity }
    },
    happy: {
        opacity: [0.4, 0.7, 0.4],
        scale: [1, 1.2, 1],
        transition: { duration: 2, repeat: Infinity }
    },
    excited: {
        opacity: [0.5, 1, 0.5],
        scale: [1, 1.3, 1],
        transition: { duration: 0.5, repeat: Infinity }
    },
    thinking: {
        opacity: 0.4,
        scale: 1,
    },
    sad: {
        opacity: 0.2,
        scale: 0.9,
    }
};

// DNA Helix Animation Speed basierend auf Mood
const getHelixSpeed = (mood: string) => {
    switch (mood) {
        case 'excited': return 1.5;
        case 'happy': return 3;
        case 'thinking': return 6;
        case 'sad': return 10;
        default: return 4;
    }
};

export function HelixAvatar({ size = 'md', showMessage = true, className = '' }: HelixAvatarProps) {
    const { currentMessage, isVisible, helixMood, hideMessage } = useHelix();

    const sizeClasses = {
        sm: 'w-12 h-12',
        md: 'w-16 h-16',
        lg: 'w-24 h-24'
    };

    const avatarSize = sizeClasses[size];
    const helixSpeed = getHelixSpeed(helixMood);

    // Generate DNA helix points for smooth rotation effect
    const helixPoints = useMemo(() => {
        const points = [];
        const numPoints = 8;
        for (let i = 0; i < numPoints; i++) {
            points.push({
                y: 12 + (i * 76 / (numPoints - 1)), // Vertical position
                phase: i * (Math.PI / 2), // Phase offset for wave
            });
        }
        return points;
    }, []);

    return (
        <div className={`relative ${className}`}>
            {/* Helix Avatar */}
            <motion.div
                className={`relative ${avatarSize} cursor-pointer`}
                variants={containerVariants}
                animate={helixMood}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {/* Outer Glow */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[--volt] to-cyan-400 blur-xl"
                    variants={glowVariants}
                    animate={helixMood}
                />
                
                {/* Glass Container */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B0B10] to-[#1a1a2e] border border-white/20 overflow-hidden shadow-2xl">
                    {/* DNA Helix SVG with CSS Animation */}
                    <svg 
                        viewBox="0 0 100 100" 
                        className="w-full h-full p-2"
                        style={{ overflow: 'visible' }}
                    >
                        <defs>
                            <linearGradient id="helixGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#D2FF00" />
                                <stop offset="100%" stopColor="#00FFAA" />
                            </linearGradient>
                            <linearGradient id="helixGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00BFFF" />
                                <stop offset="100%" stopColor="#00FFAA" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                            <filter id="softGlow">
                                <feGaussianBlur stdDeviation="0.8" result="coloredBlur"/>
                                <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                            </filter>
                        </defs>
                        
                        {/* Animated DNA Helix - Strand 1 (Back) */}
                        {helixPoints.map((point, i) => {
                            const initialCx = 50 + Math.sin(point.phase) * 18;
                            return (
                                <motion.circle
                                    key={`strand1-${i}`}
                                    r="4"
                                    fill="url(#helixGradient1)"
                                    filter="url(#glow)"
                                    cy={point.y}
                                    initial={{ 
                                        cx: initialCx,
                                        opacity: Math.cos(point.phase) > 0 ? 1 : 0.4,
                                        scale: Math.cos(point.phase) > 0 ? 1 : 0.7 
                                    }}
                                    animate={{
                                        cx: [
                                            50 + Math.sin(point.phase) * 18,
                                            50 + Math.sin(point.phase + Math.PI / 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 1.5) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2) * 18,
                                        ],
                                        opacity: [
                                            Math.cos(point.phase) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI / 2) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI * 1.5) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI * 2) > 0 ? 1 : 0.4,
                                        ],
                                        scale: [
                                            Math.cos(point.phase) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI / 2) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI * 1.5) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI * 2) > 0 ? 1 : 0.7,
                                        ],
                                    }}
                                    transition={{
                                        duration: helixSpeed,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                            );
                        })}
                        
                        {/* Animated DNA Helix - Strand 2 (Offset by PI) */}
                        {helixPoints.map((point, i) => {
                            const initialCx = 50 + Math.sin(point.phase + Math.PI) * 18;
                            return (
                                <motion.circle
                                    key={`strand2-${i}`}
                                    r="4"
                                    fill="url(#helixGradient2)"
                                    filter="url(#glow)"
                                    cy={point.y}
                                    initial={{ 
                                        cx: initialCx,
                                        opacity: Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.4,
                                        scale: Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.7 
                                    }}
                                    animate={{
                                        cx: [
                                            50 + Math.sin(point.phase + Math.PI) * 18,
                                            50 + Math.sin(point.phase + Math.PI + Math.PI / 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2.5) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 3) * 18,
                                        ],
                                        opacity: [
                                            Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI + Math.PI / 2) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI * 2) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI * 2.5) > 0 ? 1 : 0.4,
                                            Math.cos(point.phase + Math.PI * 3) > 0 ? 1 : 0.4,
                                        ],
                                        scale: [
                                            Math.cos(point.phase + Math.PI) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI + Math.PI / 2) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI * 2) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI * 2.5) > 0 ? 1 : 0.7,
                                            Math.cos(point.phase + Math.PI * 3) > 0 ? 1 : 0.7,
                                        ],
                                    }}
                                    transition={{
                                        duration: helixSpeed,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                            );
                        })}
                        
                        {/* Base Pairs (Connecting Lines) - Animated */}
                        {helixPoints.filter((_, i) => i % 2 === 0).map((point, i) => {
                            const initialX1 = 50 + Math.sin(point.phase) * 18;
                            const initialX2 = 50 + Math.sin(point.phase + Math.PI) * 18;
                            return (
                                <motion.line
                                    key={`base-${i}`}
                                    y1={point.y}
                                    y2={point.y}
                                    stroke="rgba(255,255,255,0.25)"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    filter="url(#softGlow)"
                                    initial={{ 
                                        x1: initialX1, 
                                        x2: initialX2, 
                                        opacity: 0.2 
                                    }}
                                    animate={{
                                        x1: [
                                            50 + Math.sin(point.phase) * 18,
                                            50 + Math.sin(point.phase + Math.PI / 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 1.5) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2) * 18,
                                        ],
                                        x2: [
                                            50 + Math.sin(point.phase + Math.PI) * 18,
                                            50 + Math.sin(point.phase + Math.PI + Math.PI / 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 2.5) * 18,
                                            50 + Math.sin(point.phase + Math.PI * 3) * 18,
                                        ],
                                        opacity: [0.2, 0.4, 0.2, 0.4, 0.2],
                                    }}
                                    transition={{
                                        duration: helixSpeed,
                                        repeat: Infinity,
                                        ease: "linear",
                                    }}
                                />
                            );
                        })}
                        
                        {/* Face - Eyes with Mood Animation */}
                        <motion.circle
                            cx="40"
                            cy="50"
                            r="4"
                            fill="white"
                            animate={helixMood === 'happy' || helixMood === 'excited' 
                                ? { scaleY: [1, 0.2, 1], y: [0, 2, 0] } 
                                : helixMood === 'thinking'
                                ? { y: [-1, 1, -1] }
                                : helixMood === 'sad'
                                ? { y: 3, scaleY: 0.8 }
                                : {}
                            }
                            transition={{ 
                                duration: helixMood === 'excited' ? 0.3 : 0.5, 
                                repeat: helixMood === 'excited' ? Infinity : helixMood === 'thinking' ? Infinity : 0, 
                                repeatDelay: helixMood === 'excited' ? 1 : 2 
                            }}
                        />
                        <motion.circle
                            cx="60"
                            cy="50"
                            r="4"
                            fill="white"
                            animate={helixMood === 'happy' || helixMood === 'excited' 
                                ? { scaleY: [1, 0.2, 1], y: [0, 2, 0] } 
                                : helixMood === 'thinking'
                                ? { y: [-1, 1, -1] }
                                : helixMood === 'sad'
                                ? { y: 3, scaleY: 0.8 }
                                : {}
                            }
                            transition={{ 
                                duration: helixMood === 'excited' ? 0.3 : 0.5, 
                                repeat: helixMood === 'excited' ? Infinity : helixMood === 'thinking' ? Infinity : 0, 
                                repeatDelay: helixMood === 'excited' ? 1 : 2 
                            }}
                        />
                        
                        {/* Face - Mouth with Smooth Transition */}
                        <motion.path
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            initial={{ d: "M43 60 Q50 64 57 60" }}
                            animate={{
                                d: helixMood === 'sad' 
                                    ? "M42 63 Q50 58 58 63" 
                                    : helixMood === 'excited'
                                    ? "M38 58 Q50 72 62 58"
                                    : helixMood === 'happy'
                                    ? "M40 60 Q50 68 60 60"
                                    : "M43 60 Q50 64 57 60"
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </svg>
                </div>
            </motion.div>

            {/* Message Bubble */}
            <AnimatePresence>
                {showMessage && isVisible && currentMessage && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
                        animate={{ opacity: 1, scale: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, scale: 0.8, y: 10, x: '-50%' }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute top-full left-1/2 mt-3 w-72 max-w-[90vw] z-50"
                    >
                        {/* Speech Bubble */}
                        <div className="relative bg-[#12121A]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
                            {/* Arrow */}
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#12121A] border-l border-t border-white/10 rotate-45" />
                            
                            {/* Close Button */}
                            <button
                                onClick={hideMessage}
                                className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                            >
                                <X size={12} />
                            </button>
                            
                            {/* Message Content */}
                            <div className="pr-6">
                                <p className="text-sm text-white/90 leading-relaxed">
                                    {currentMessage.message}
                                </p>
                            </div>
                            
                            {/* Mood Indicator */}
                            <div className="mt-2 flex items-center gap-2">
                                <span className="text-[10px] uppercase tracking-widest text-white/30 font-mono">
                                    HELIX
                                </span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

