'use client';

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { TOUR_STEPS, TourStep } from './tourSteps';

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  steps: TourStep[];
  currentStepData: TourStep | null;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
  goToStep: (stepIndex: number) => void;
}

const TourContext = createContext<TourContextType | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error('useTour must be used within AppTourProvider');
  }
  return context;
}

// Safe hook that doesn't throw if used outside provider
export function useTourSafe() {
  return useContext(TourContext);
}

interface AppTourProviderProps {
  children: ReactNode;
}

export function AppTourProvider({ children }: AppTourProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = TOUR_STEPS;
  const currentStepData = isActive && steps[currentStep] ? steps[currentStep] : null;

  // Check if tour should auto-start (after onboarding)
  useEffect(() => {
    // Only check on home page
    if (pathname !== '/') return;
    
    const shouldStartTour = localStorage.getItem('stax_start_tour');
    const tourCompleted = localStorage.getItem('stax_tour_completed');
    
    if (shouldStartTour === 'true' && tourCompleted !== 'true') {
      // Small delay to let the page render
      const timer = setTimeout(() => {
        localStorage.removeItem('stax_start_tour');
        setIsActive(true);
        setCurrentStep(0);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Navigate to correct route when step changes
  useEffect(() => {
    if (!isActive || !currentStepData) return;

    const targetRoute = currentStepData.route;
    if (pathname !== targetRoute) {
      router.push(targetRoute);
    }
  }, [isActive, currentStep, currentStepData, pathname, router]);

  const startTour = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    
    // Navigate to first step's route
    const firstStep = steps[0];
    if (firstStep && pathname !== firstStep.route) {
      router.push(firstStep.route);
    }
  }, [steps, pathname, router]);

  const nextStep = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Last step - complete tour
      setIsActive(false);
      setCurrentStep(0);
      localStorage.setItem('stax_tour_completed', 'true');
    }
  }, [currentStep, steps.length]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const skipTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('stax_tour_completed', 'true');
    
    // Navigate to home
    if (pathname !== '/') {
      router.push('/');
    }
  }, [pathname, router]);

  const completeTour = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    localStorage.setItem('stax_tour_completed', 'true');
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    if (stepIndex >= 0 && stepIndex < steps.length) {
      setCurrentStep(stepIndex);
    }
  }, [steps.length]);

  const value: TourContextType = {
    isActive,
    currentStep,
    steps,
    currentStepData,
    startTour,
    nextStep,
    prevStep,
    skipTour,
    completeTour,
    goToStep,
  };

  return (
    <TourContext.Provider value={value}>
      {children}
    </TourContext.Provider>
  );
}
