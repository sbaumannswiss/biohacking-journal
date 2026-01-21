'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, X, Check } from 'lucide-react';
import { useTourSafe } from './AppTourProvider';
import { cn } from '@/lib/utils';

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export function TourOverlay() {
  const tour = useTourSafe();
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [bottomNavHeight, setBottomNavHeight] = useState(120); // Fallback

  // Measure BottomNav height dynamically
  useEffect(() => {
    const measureBottomNav = () => {
      const nav = document.querySelector('[data-bottom-nav]');
      if (nav) {
        const rect = nav.getBoundingClientRect();
        setBottomNavHeight(rect.height + 16); // +16px spacing
      }
    };
    
    measureBottomNav();
    window.addEventListener('resize', measureBottomNav);
    
    // Also measure after a short delay to catch late renders
    const timer = setTimeout(measureBottomNav, 100);
    
    return () => {
      window.removeEventListener('resize', measureBottomNav);
      clearTimeout(timer);
    };
  }, []);

  // Find and measure target element
  const measureTarget = useCallback(() => {
    if (!tour?.currentStepData) {
      setTargetRect(null);
      setIsReady(false);
      return;
    }

    const targetId = tour.currentStepData.targetId;
    const element = document.querySelector(`[data-tour-id="${targetId}"]`);
    
    if (element) {
      const rect = element.getBoundingClientRect();
      const padding = 8; // Padding around spotlight
      
      setTargetRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        bottom: rect.bottom + padding,
        right: rect.right + padding,
      });
      setIsReady(true);
    } else {
      // Element not found yet - use center fallback
      setTargetRect(null);
      setIsReady(true);
    }
  }, [tour?.currentStepData]);

  // Reset isReady when step changes to prevent animation glitch
  useEffect(() => {
    setIsReady(false);
    setTargetRect(null);
  }, [tour?.currentStep]);

  // Measure on step change and window resize
  useEffect(() => {
    if (!tour?.isActive) {
      setIsReady(false);
      return;
    }

    // Delay to let page render and reset complete
    const initialTimer = setTimeout(measureTarget, 200);
    
    // Re-measure on resize
    window.addEventListener('resize', measureTarget);
    
    // Re-measure periodically in case element loads late
    const interval = setInterval(measureTarget, 500);
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', measureTarget);
      clearInterval(interval);
    };
  }, [tour?.isActive, tour?.currentStep, measureTarget]);

  if (!tour?.isActive || !tour.currentStepData || !isReady) {
    return null;
  }

  const { currentStep, steps, currentStepData, nextStep, prevStep, skipTour } = tour;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  // Popup always centered at bottom - dynamically positioned above BottomNav
  const popupStyle = {
    bottom: bottomNavHeight,
    left: '50%',
    transform: 'translateX(-50%)',
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-auto"
      >
        {/* Dark overlay with spotlight cutout */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        >
          <defs>
            <mask id="spotlight-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              {targetRect && (
                <motion.rect
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  x={targetRect.left}
                  y={targetRect.top}
                  width={targetRect.width}
                  height={targetRect.height}
                  rx="12"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.85)"
            mask="url(#spotlight-mask)"
          />
        </svg>

        {/* Spotlight border glow */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute rounded-xl pointer-events-none"
            style={{
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              boxShadow: '0 0 0 2px rgba(167, 243, 208, 0.6), 0 0 30px rgba(167, 243, 208, 0.3)',
            }}
          />
        )}

        {/* Popup Card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute w-[min(320px,calc(100vw-32px))] bg-card/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          style={popupStyle}
        >
          {/* Header with icon and step counter */}
          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <div className="flex items-center gap-2">
              {currentStepData.icon && (
                <span className="text-2xl">{currentStepData.icon}</span>
              )}
              <h3 className="font-bold text-lg text-foreground">
                {currentStepData.title}
              </h3>
            </div>
            <button
              onClick={skipTour}
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Tour beenden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Description */}
          <div className="px-4 pb-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentStepData.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 pb-3">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  idx === currentStep
                    ? "bg-primary w-6"
                    : idx < currentStep
                    ? "bg-primary/50"
                    : "bg-white/20"
                )}
              />
            ))}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center gap-2 px-4 pb-4">
            {!isFirstStep && (
              <button
                onClick={prevStep}
                className="flex items-center justify-center gap-1 px-4 py-2.5 rounded-xl bg-white/10 text-foreground font-medium text-sm hover:bg-white/15 transition-colors"
              >
                <ArrowLeft size={16} />
                <span>Zurück</span>
              </button>
            )}
            
            <button
              onClick={nextStep}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all",
                isLastStep
                  ? "bg-gradient-to-r from-primary to-cyan-400 text-primary-foreground shadow-lg shadow-primary/20"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              {isLastStep ? (
                <>
                  <Check size={18} />
                  <span>Los geht&apos;s!</span>
                </>
              ) : (
                <>
                  <span>Weiter</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Skip link */}
          <div className="text-center pb-3">
            <button
              onClick={skipTour}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tour überspringen
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
