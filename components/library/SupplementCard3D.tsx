'use client';

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { 
    Plus, Check, Clock, Beaker, Star, Minus, Trash2,
    Zap, Moon, Droplet, Sun, Anchor, Wind, Shield, Feather, Brain, Flame,
    Sunrise, Layers, Hexagon, Mountain, Flower2, Circle, Infinity, Sprout,
    Coffee, Lightbulb, Leaf, Wine, Heart, Battery, Bone, Sparkles, Citrus,
    ArrowUp, Activity, Book, Smile, Pill, Package, FlaskConical,
    type LucideIcon
} from 'lucide-react';
import { Supplement } from '@/data/supplements';
import { cn } from '@/lib/utils';

// Icon mapping for supplements
const ICON_MAP: Record<string, LucideIcon> = {
    'Zap': Zap,
    'Moon': Moon,
    'Droplet': Droplet,
    'Sun': Sun,
    'Anchor': Anchor,
    'Wind': Wind,
    'Shield': Shield,
    'Feather': Feather,
    'Brain': Brain,
    'Flame': Flame,
    'Sunrise': Sunrise,
    'Layers': Layers,
    'Hexagon': Hexagon,
    'Mountain': Mountain,
    'Flower': Flower2,
    'Flower2': Flower2,
    'Circle': Circle,
    'Infinity': Infinity,
    'Sprout': Sprout,
    'Coffee': Coffee,
    'Lightbulb': Lightbulb,
    'Leaf': Leaf,
    'Wine': Wine,
    'Heart': Heart,
    'Battery': Battery,
    'Bone': Bone,
    'Sparkle': Sparkles,
    'Sparkles': Sparkles,
    'Citrus': Citrus,
    'ArrowUp': ArrowUp,
    'Activity': Activity,
    'Book': Book,
    'Smile': Smile,
    'Pill': Pill,
    'Package': Package,
    'Flask': FlaskConical,
    // Fallbacks for icons that don't exist in Lucide
    'Bull': Flame,
    'Mushroom': Sprout,
    'Bacteria': Circle,
};

function getSupplementIcon(iconName: string): LucideIcon {
    return ICON_MAP[iconName] || Pill;
}

interface SupplementCard3DProps {
    supplement: Supplement;
    isInStack: boolean;
    isCenter: boolean;
    onAddToStack: () => void;
    onRemoveFromStack: () => void;
    onDeleteFromLibrary?: () => void;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function SupplementCard3D({
    supplement,
    isInStack,
    isCenter,
    onAddToStack,
    onRemoveFromStack,
    onDeleteFromLibrary,
    style,
    onClick,
}: SupplementCard3DProps) {
    const isCustom = supplement.id.startsWith('custom:') || (supplement as any).isCustom;
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Manual rotation state
    const rotationY = useMotionValue(0);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startRotation = useRef(0);
    
    // Transform rotation to check if showing back
    const rotation = useTransform(rotationY, (val) => val % 360);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (!isCenter) return;
        isDragging.current = false;
        startX.current = e.clientX;
        startRotation.current = rotationY.get();
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isCenter || startX.current === 0) return;
        const deltaX = e.clientX - startX.current;
        
        // If moved more than 10px, consider it a drag
        if (Math.abs(deltaX) > 10) {
            isDragging.current = true;
        }
        
        // Rotate based on drag distance (1px = 0.5deg)
        const newRotation = startRotation.current + deltaX * 0.5;
        rotationY.set(newRotation);
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (!isCenter) return;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
        
        if (isDragging.current) {
            // Snap to nearest 0 or 180 degrees
            const currentRotation = rotationY.get() % 360;
            const normalizedRotation = currentRotation < 0 ? currentRotation + 360 : currentRotation;
            
            let targetRotation;
            if (normalizedRotation < 90 || normalizedRotation >= 270) {
                // Snap to front (0)
                targetRotation = normalizedRotation < 90 ? 0 : 360;
                setIsFlipped(false);
            } else {
                // Snap to back (180)
                targetRotation = 180;
                setIsFlipped(true);
            }
            
            // Animate to snap position with slow, satisfying animation
            animate(rotationY, targetRotation, {
                type: 'spring',
                stiffness: 50,
                damping: 12,
            });
            
            if (navigator.vibrate) navigator.vibrate(15);
        }
        
        startX.current = 0;
    };

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isCenter) {
            onClick?.();
            return;
        }
        
        // Only flip on tap, not drag
        if (!isDragging.current) {
            const newFlipped = !isFlipped;
            setIsFlipped(newFlipped);
            
            // Animate rotation with slow, satisfying animation
            animate(rotationY, newFlipped ? 180 : 0, {
                type: 'spring',
                stiffness: 40,
                damping: 10,
            });
            
            if (navigator.vibrate) navigator.vibrate(20);
        }
        
        isDragging.current = false;
    };

    const handleAction = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInStack) {
            onRemoveFromStack();
        } else {
            onAddToStack();
        }
    };

    const renderStars = () => {
        return Array.from({ length: 5 }).map((_, i) => (
            <Star
                key={i}
                size={12}
                className={cn(
                    "transition-colors",
                    i < supplement.evidence_level
                        ? "fill-amber-400 text-amber-400"
                        : "fill-transparent text-white/20"
                )}
            />
        ));
    };

    const getCategoryColor = () => {
        const benefits = supplement.benefits[0]?.toLowerCase() || '';
        if (benefits.includes('sleep')) return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
        if (benefits.includes('energy') || benefits.includes('strength')) return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
        if (benefits.includes('focus') || benefits.includes('cognition')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
        if (benefits.includes('stress') || benefits.includes('mood')) return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
        return 'bg-primary/20 text-primary border-primary/30';
    };

    // Card thickness for 3D effect - glass-like tile
    const CARD_THICKNESS = 15;

    return (
        <motion.div
            className="relative cursor-pointer select-none touch-none"
            style={{
                width: '280px',
                height: '380px',
                transformStyle: 'preserve-3d',
                perspective: '1000px',
                ...style,
            }}
            onClick={handleCardClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            whileTap={isCenter && !isDragging.current ? { scale: 0.98 } : undefined}
        >
            {/* Card Container with 3D Flip - Manual rotation */}
            <motion.div
                className="w-full h-full relative"
                style={{
                    rotateY: rotationY,
                    transformStyle: 'preserve-3d',
                }}
            >

                {/* Front Face - Clean dark design */}
                <div 
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                    )}
                    style={{
                        background: '#0a0a0f',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        border: isCenter ? '2px solid rgba(20, 184, 166, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: isCenter 
                            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8)' 
                            : '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
                    }}
                >

                    {/* Content */}
                    <div className="p-6 flex flex-col items-center h-full">
                        {/* Custom Badge */}
                        {isCustom && (
                            <div className="absolute top-4 left-4 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full">
                                <span className="text-[9px] font-medium text-cyan-400 uppercase tracking-wider">Gescannt</span>
                            </div>
                        )}

                        {/* Icon */}
                        <div className="mb-4 mt-2 p-4 rounded-2xl bg-primary/10 border border-primary/20">
                            {(() => {
                                const IconComponent = getSupplementIcon(supplement.icon);
                                return <IconComponent size={48} className="text-primary" strokeWidth={1.5} />;
                            })()}
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold text-white text-center mb-2 leading-tight">
                            {supplement.name}
                        </h3>

                        {/* Evidence Stars */}
                        <div className="flex gap-0.5 mb-4">
                            {renderStars()}
                        </div>

                        {/* Benefits Tags */}
                        <div className="flex flex-wrap gap-1.5 justify-center mb-4">
                            {supplement.benefits.slice(0, 3).map((benefit, idx) => (
                                <span
                                    key={idx}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider border",
                                        getCategoryColor()
                                    )}
                                >
                                    {benefit}
                                </span>
                            ))}
                        </div>

                        <div className="flex-1" />

                        {/* In Stack Indicator */}
                        {isInStack && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/20 rounded-full text-primary text-xs font-medium mb-3">
                                <Check size={14} />
                                Im Stack
                            </div>
                        )}

                        {/* Tap Hint */}
                        {isCenter && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-[10px] text-white/40 uppercase tracking-widest"
                            >
                                Tap für Details
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Back Face - Clean dark design */}
                <div 
                    className={cn(
                        "absolute inset-0 w-full h-full rounded-3xl overflow-hidden"
                    )}
                    style={{
                        background: '#0a0a0f',
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                        border: '2px solid rgba(20, 184, 166, 0.3)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
                    }}
                >
                    {/* Top Bar with Name */}
                    <div className="bg-primary/10 px-4 py-3 border-b border-white/5">
                        <div className="flex items-center gap-2">
                            {(() => {
                                const IconComponent = getSupplementIcon(supplement.icon);
                                return <IconComponent size={18} className="text-primary" strokeWidth={1.5} />;
                            })()}
                            <h3 className="text-sm font-bold text-white truncate flex-1">
                                {supplement.name}
                            </h3>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col h-[calc(100%-52px)] overflow-hidden">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white/5 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 text-white/40 mb-1">
                                    <Beaker size={11} />
                                    <span className="text-[10px] uppercase">Dosierung</span>
                                </div>
                                <div className="text-xs font-medium text-white truncate">
                                    {supplement.optimal_dosage}
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-2.5">
                                <div className="flex items-center gap-1.5 text-white/40 mb-1">
                                    <Clock size={11} />
                                    <span className="text-[10px] uppercase">Zeit</span>
                                </div>
                                <div className="text-xs font-medium text-white truncate">
                                    {supplement.best_time}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex-1 min-h-0 overflow-y-auto mb-3">
                            <p className="text-xs text-white/60 leading-relaxed">
                                {supplement.description}
                            </p>
                        </div>

                        {/* Benefits */}
                        {supplement.benefits && supplement.benefits.length > 0 && (
                            <div className="mb-3">
                                <div className="flex flex-wrap gap-1">
                                    {supplement.benefits.slice(0, 4).map((benefit, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full font-medium"
                                        >
                                            {benefit}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Warning */}
                        {supplement.warnings && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 mb-3">
                                <p className="text-[10px] text-amber-400 leading-relaxed line-clamp-2">
                                    {supplement.warnings}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2 mt-auto">
                            {isCustom && onDeleteFromLibrary && (
                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteFromLibrary();
                                    }}
                                    className="p-2.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 transition-all"
                                    title="Aus Library löschen"
                                >
                                    <Trash2 size={16} />
                                </motion.button>
                            )}
                            
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={handleAction}
                                className={cn(
                                    "flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all",
                                    isInStack
                                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                {isInStack ? (
                                    <>
                                        <Minus size={16} />
                                        Aus Stack
                                    </>
                                ) : (
                                    <>
                                        <Plus size={16} />
                                        Hinzufügen
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
