'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Supplement } from '@/data/supplements';
import { SupplementCard3D } from './SupplementCard3D';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface Carousel3DProps {
    supplements: Supplement[];
    userStackIds: Set<string>;
    onAddToStack: (supplement: Supplement) => void;
    onRemoveFromStack: (supplement: Supplement) => void;
    onDeleteFromLibrary?: (supplement: Supplement) => void;
    initialIndex?: number;
}

export function Carousel3D({
    supplements,
    userStackIds,
    onAddToStack,
    onRemoveFromStack,
    onDeleteFromLibrary,
    initialIndex,
}: Carousel3DProps) {
    const t = useTranslations('library');
    const [cardWidth, setCardWidth] = useState(280);

    // Responsive Card Width
    useEffect(() => {
        const handleResize = () => {
            const width = Math.min(280, window.innerWidth * 0.75);
            setCardWidth(width);
        };

        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [activeIndex, setActiveIndex] = useState(initialIndex || 0);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartX = useRef(0);
    const dragDelta = useRef(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const prevSupplementsLength = useRef(supplements.length);

    // Reset activeIndex when supplements list changes (e.g., search filter)
    useEffect(() => {
        // If supplements changed, reset to 0
        if (supplements.length !== prevSupplementsLength.current) {
            setActiveIndex(0);
            prevSupplementsLength.current = supplements.length;
        }
        // Also ensure activeIndex is within bounds
        if (activeIndex >= supplements.length && supplements.length > 0) {
            setActiveIndex(supplements.length - 1);
        }
    }, [supplements.length, activeIndex]);

    // Jump to initialIndex when it changes (e.g., from highlight param)
    useEffect(() => {
        if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < supplements.length) {
            setActiveIndex(initialIndex);
        }
    }, [initialIndex, supplements.length]);

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft' && activeIndex > 0) {
                setActiveIndex(prev => prev - 1);
                if (navigator.vibrate) navigator.vibrate(10);
            } else if (e.key === 'ArrowRight' && activeIndex < supplements.length - 1) {
                setActiveIndex(prev => prev + 1);
                if (navigator.vibrate) navigator.vibrate(10);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeIndex, supplements.length]);

    const goToNext = useCallback(() => {
        if (activeIndex < supplements.length - 1) {
            setActiveIndex(prev => prev + 1);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }, [activeIndex, supplements.length]);

    const goToPrevious = useCallback(() => {
        if (activeIndex > 0) {
            setActiveIndex(prev => prev - 1);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }, [activeIndex]);

    const goToIndex = useCallback((index: number) => {
        if (index >= 0 && index < supplements.length && index !== activeIndex) {
            setActiveIndex(index);
            if (navigator.vibrate) navigator.vibrate(10);
        }
    }, [activeIndex, supplements.length]);

    // Touch/Mouse Drag Handling
    const handleDragStart = (clientX: number) => {
        setIsDragging(true);
        dragStartX.current = clientX;
        dragDelta.current = 0;
    };

    const handleDragMove = (clientX: number) => {
        if (!isDragging) return;
        dragDelta.current = clientX - dragStartX.current;
    };

    const handleDragEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);

        const threshold = 50;
        if (dragDelta.current > threshold) {
            goToPrevious();
        } else if (dragDelta.current < -threshold) {
            goToNext();
        }
        dragDelta.current = 0;
    };

    // POKEMON TCG POCKET STIL - getCardStyle mit translate3d für Hardware-Acceleration
    const getCardStyle = (index: number): React.CSSProperties => {
        const offset = index - activeIndex;
        const absOffset = Math.abs(offset);

        // Zeige 2 Karten auf jeder Seite für mehr Tiefe
        if (absOffset > 2) {
            return { display: 'none' };
        }

        const peekAmount = cardWidth * 0.45; // Relativ zur Breite (ca 120px bei 280px Breite)

        // ZENTRUM-KARTE (absOffset === 0)
        if (absOffset === 0) {
            return {
                transform: `translate3d(0, 0, 0) rotateY(0deg) scale(1)`,
                opacity: 1,
                zIndex: 20,
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s',
                filter: 'none',
                transformStyle: 'preserve-3d',
            };
        }

        // ERSTE SEITLICHE KARTEN (absOffset === 1)
        if (absOffset === 1) {
            const translateX = offset > 0
                ? cardWidth - peekAmount + 20  // Rechts
                : -(cardWidth - peekAmount + 20); // Links

            return {
                transform: `translate3d(${translateX}px, 0, -50px) rotateY(${offset * -15}deg) scale(0.88)`,
                opacity: 0.75,
                zIndex: 15,
                transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s',
                filter: 'brightness(0.85)',
                transformStyle: 'preserve-3d',
            };
        }

        // ZWEITE SEITLICHE KARTEN (absOffset === 2) - Peek-Effekt
        const translateX = offset > 0
            ? cardWidth * 1.4  // Weiter rechts
            : -(cardWidth * 1.4); // Weiter links

        return {
            transform: `translate3d(${translateX}px, 0, -100px) rotateY(${offset * -20}deg) scale(0.75)`,
            opacity: 0.4,
            zIndex: 10,
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.4s',
            filter: 'brightness(0.6)',
            transformStyle: 'preserve-3d',
        };
    };

    if (supplements.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                Keine Supplements gefunden
            </div>
        );
    }

    return (
        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden">

            {/* Carousel Container - Enhanced 3D Perspective */}
            <div
                ref={containerRef}
                className="relative w-full h-[min(480px,60vh)] flex items-center justify-center"
                style={{
                    perspective: '1800px',
                    WebkitPerspective: '1800px',
                    perspectiveOrigin: '50% 50%',
                    transformStyle: 'preserve-3d',
                    WebkitTransformStyle: 'preserve-3d',
                }}
                onPointerDown={(e) => {
                    e.preventDefault();
                    handleDragStart(e.clientX);
                }}
                onPointerMove={(e) => {
                    if (isDragging) {
                        e.preventDefault();
                        handleDragMove(e.clientX);
                    }
                }}
                onPointerUp={handleDragEnd}
                onPointerCancel={handleDragEnd}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => {
                    if (isDragging) handleDragMove(e.touches[0].clientX);
                }}
                onTouchEnd={handleDragEnd}
            >
                {/* Cards Container - preserve-3d MUSS hier sein */}
                <div
                    className="relative flex items-center justify-center"
                    style={{
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d',
                        WebkitTransformStyle: 'preserve-3d',
                        position: 'relative',
                    }}
                >
                    <AnimatePresence mode="popLayout">
                        {supplements.map((supplement, index) => {
                            const offset = index - activeIndex;
                            const absOffset = Math.abs(offset);

                            if (absOffset > 1) return null;

                            const slideDirection = offset > 0 ? 1 : offset < 0 ? -1 : 0;
                            const cardStyle = getCardStyle(index);

                            return (
                                <motion.div
                                    key={supplement.id}
                                    className="absolute"
                                    style={{
                                        ...cardStyle,
                                        transformStyle: 'preserve-3d',
                                        WebkitTransformStyle: 'preserve-3d',
                                    }}
                                    initial={{
                                        opacity: 0,
                                        x: slideDirection * 300,
                                        z: -100,
                                        scale: 0.8,
                                        rotateY: slideDirection * 15
                                    }}
                                    animate={{
                                        opacity: cardStyle.opacity,
                                        x: absOffset === 0 ? 0 : (offset > 0 ? 80 : -80),
                                        z: absOffset === 0 ? 0 : -50,
                                        scale: absOffset === 0 ? 1 : 0.88,
                                        rotateY: absOffset === 0 ? 0 : (offset > 0 ? -10 : 10)
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: -slideDirection * 300,
                                        z: -100,
                                        scale: 0.8,
                                        rotateY: -slideDirection * 15
                                    }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 35,
                                        mass: 0.8,
                                    }}
                                >
                                    <SupplementCard3D
                                        supplement={supplement}
                                        isInStack={userStackIds.has(supplement.id)}
                                        isCenter={index === activeIndex}
                                        onAddToStack={() => onAddToStack(supplement)}
                                        onRemoveFromStack={() => onRemoveFromStack(supplement)}
                                        onDeleteFromLibrary={onDeleteFromLibrary ? () => onDeleteFromLibrary(supplement) : undefined}
                                        onClick={() => goToIndex(index)}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            </div>

            {/* Navigation Arrows */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none z-20">
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToPrevious}
                    disabled={activeIndex === 0}
                    className={cn(
                        "pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        "bg-muted/50 backdrop-blur-md border border-border",
                        activeIndex === 0
                            ? "opacity-30 cursor-not-allowed"
                            : "opacity-100 hover:bg-muted"
                    )}
                >
                    <ChevronLeft size={24} className="text-foreground" />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={goToNext}
                    disabled={activeIndex === supplements.length - 1}
                    className={cn(
                        "pointer-events-auto w-12 h-12 rounded-full flex items-center justify-center transition-all",
                        "bg-muted/50 backdrop-blur-md border border-border",
                        activeIndex === supplements.length - 1
                            ? "opacity-30 cursor-not-allowed"
                            : "opacity-100 hover:bg-muted"
                    )}
                >
                    <ChevronRight size={24} className="text-foreground" />
                </motion.button>
            </div>

            {/* Pagination - Clean centered design */}
            <div className="flex items-center justify-center gap-3 mt-6">
                <button
                    onClick={goToPrevious}
                    disabled={activeIndex === 0}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={20} />
                </button>
                <span className="text-sm text-muted-foreground min-w-[6rem] text-center">
                    {t('pagination', { index: activeIndex + 1, total: supplements.length })}
                </span>
                <button
                    onClick={goToNext}
                    disabled={activeIndex === supplements.length - 1}
                    className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}
