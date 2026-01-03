'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Sparkles, Star, Zap, Flame } from 'lucide-react';

interface SuccessOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    xpGained?: number; // Optional - neues XP-System zeigt kein XP pro Check-In
    streak?: number;
    message?: string;
}

// Duolingo-Style Sparkle Particles
const SparkleParticle = ({ delay, x, y }: { delay: number; x: number; y: number }) => (
    <motion.div
        className="absolute text-[--volt]"
        initial={{ opacity: 0, scale: 0, x: '50%', y: '50%' }}
        animate={{ 
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
            x: `${50 + x}%`,
            y: `${50 + y}%`,
        }}
        transition={{ 
            duration: 0.8,
            delay,
            ease: "easeOut"
        }}
    >
        <Star size={16} fill="currentColor" />
    </motion.div>
);

// Animierter Helix für Success
const CelebrationHelix = () => (
    <motion.div
        className="relative w-32 h-32"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", bounce: 0.5, duration: 0.8 }}
    >
        {/* Outer Glow Ring */}
        <motion.div
            className="absolute inset-0 rounded-full"
            animate={{
                boxShadow: [
                    '0 0 20px rgba(210, 255, 0, 0.3)',
                    '0 0 40px rgba(210, 255, 0, 0.5)',
                    '0 0 20px rgba(210, 255, 0, 0.3)',
                ]
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
        />
        
        {/* Main Circle */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B0B10] to-[#1a1a2e] border-2 border-[--volt]/30 overflow-hidden flex items-center justify-center">
            {/* DNA Helix SVG */}
            <svg viewBox="0 0 100 100" className="w-24 h-24">
                <defs>
                    <linearGradient id="celebGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#D2FF00" />
                        <stop offset="100%" stopColor="#00FFAA" />
                    </linearGradient>
                    <linearGradient id="celebGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#00BFFF" />
                        <stop offset="100%" stopColor="#00FFAA" />
                    </linearGradient>
                    <filter id="celebGlow">
                        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                        <feMerge>
                            <feMergeNode in="coloredBlur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Animated DNA Strands */}
                <motion.path
                    d="M30 15 Q45 30 30 45 Q15 60 30 75 Q45 90 30 95"
                    fill="none"
                    stroke="url(#celebGradient1)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#celebGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                />
                
                <motion.path
                    d="M70 15 Q55 30 70 45 Q85 60 70 75 Q55 90 70 95"
                    fill="none"
                    stroke="url(#celebGradient2)"
                    strokeWidth="4"
                    strokeLinecap="round"
                    filter="url(#celebGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                />
                
                {/* Base Pairs */}
                {[25, 40, 55, 70, 85].map((y, i) => (
                    <motion.line
                        key={y}
                        x1="35" y1={y} x2="65" y2={y}
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.05, duration: 0.2 }}
                    />
                ))}
                
                {/* Happy Face - Closed Eyes (Celebrating) */}
                <motion.path
                    d="M36 48 Q40 52 44 48"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                />
                <motion.path
                    d="M56 48 Q60 52 64 48"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                />
                
                {/* Big Smile */}
                <motion.path
                    d="M38 58 Q50 72 62 58"
                    fill="none"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    initial={{ opacity: 0, pathLength: 0 }}
                    animate={{ opacity: 1, pathLength: 1 }}
                    transition={{ delay: 0.6, duration: 0.3 }}
                />
            </svg>
        </div>
        
        {/* Bounce Animation */}
        <motion.div
            className="absolute inset-0"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 0.4, delay: 0.8, repeat: 2 }}
        />
    </motion.div>
);

export function SuccessOverlay({ isOpen, onClose, xpGained, streak, message }: SuccessOverlayProps) {
    const [showSparkles, setShowSparkles] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Trigger sparkles after initial animation
            const sparkleTimer = setTimeout(() => setShowSparkles(true), 400);
            
            // Auto Close Timer
            const closeTimer = setTimeout(() => {
                onClose();
            }, 2500);
            
            return () => {
                clearTimeout(sparkleTimer);
                clearTimeout(closeTimer);
            };
        } else {
            setShowSparkles(false);
        }
    }, [isOpen, onClose]);

    // Sparkle positions (around the helix)
    const sparklePositions = [
        { x: -40, y: -30, delay: 0 },
        { x: 40, y: -25, delay: 0.1 },
        { x: -35, y: 25, delay: 0.2 },
        { x: 45, y: 30, delay: 0.15 },
        { x: 0, y: -45, delay: 0.25 },
        { x: -50, y: 0, delay: 0.3 },
        { x: 50, y: 5, delay: 0.2 },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="relative bg-[#12121A]/95 border border-white/10 p-8 rounded-3xl text-center max-w-xs w-full shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sparkle Particles */}
                        {showSparkles && sparklePositions.map((pos, i) => (
                            <SparkleParticle key={i} {...pos} />
                        ))}
                        
                        {/* Celebration Helix */}
                        <div className="flex justify-center mb-6">
                            <CelebrationHelix />
                        </div>

                        {/* Success Text */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <h2 className="text-2xl font-bold text-white mb-1">
                                {message || 'Excellent!'}
                            </h2>
                            <p className="text-white/50 text-sm mb-5">
                                Stack logged successfully
                            </p>
                        </motion.div>

                        {/* Streak Badge (XP wird nicht mehr pro Check-In angezeigt) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5, type: "spring" }}
                            className="flex items-center justify-center gap-3"
                        >
                            {/* XP nur anzeigen wenn explizit übergeben (für Quests etc.) */}
                            {xpGained && xpGained > 0 && (
                                <div className="flex items-center gap-2 bg-[--volt]/10 border border-[--volt]/30 px-4 py-2 rounded-xl">
                                    <Zap size={18} className="text-[--volt]" fill="currentColor" />
                                    <span className="text-[--volt] font-bold font-mono">+{xpGained} XP</span>
                                </div>
                            )}
                            
                            {streak && streak > 0 && (
                                <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 px-4 py-2 rounded-xl">
                                    <Flame size={18} className="text-orange-400" fill="currentColor" />
                                    <span className="text-orange-400 font-bold font-mono">{streak} 🔥</span>
                                </div>
                            )}
                        </motion.div>

                        {/* Tap to dismiss hint */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 0.4 }}
                            transition={{ delay: 1 }}
                            className="text-xs text-white/40 mt-4"
                        >
                            Tap to dismiss
                        </motion.p>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
