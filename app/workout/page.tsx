'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Dumbbell, 
  Heart, 
  Zap, 
  Droplets,
  Play,
  Square,
  Clock,
  ChevronRight,
  Check,
  Loader2,
  Plus,
  Minus,
  X,
  Bike,
  Waves,
  Activity,
  Lightbulb,
  Footprints,
  Sparkles,
  Leaf,
  FlaskConical,
  Coffee,
  Candy,
  Pill,
  type LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserStack, StackItem, addToStack } from '@/lib/supabaseService';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';
import { 
  getActiveWorkout as getStoredWorkout, 
  startWorkout as startStoredWorkout,
  endWorkout as endStoredWorkout,
  clearWorkout as clearStoredWorkout,
  addHydration as addStoredHydration,
  getTodayHydration,
  calculateHydrationGoal,
  getHydrationRecommendations,
  HydrationSupplement,
} from '@/lib/workout';
import { 
  getPhaseSupplements, 
  getLibraryRecommendations,
  WorkoutSupplementRecommendation 
} from '@/lib/recommendations/workoutTimingOptimizer';
import { WorkoutType, WorkoutPhase, ActiveWorkout } from '@/types';

// Hydration Icon Mapping
const HYDRATION_ICONS: Record<string, LucideIcon> = {
  droplet: Droplets,
  zap: Zap,
  sparkles: Sparkles,
  leaf: Leaf,
  beaker: FlaskConical,
  cup: Coffee,
  dumbbell: Dumbbell,
  candy: Candy,
};

// Workout Type Icons
const WORKOUT_TYPES: { id: WorkoutType; icon: typeof Dumbbell; color: string }[] = [
  { id: 'strength', icon: Dumbbell, color: 'text-red-400' },
  { id: 'cardio', icon: Heart, color: 'text-pink-400' },
  { id: 'hiit', icon: Zap, color: 'text-yellow-400' },
  { id: 'yoga', icon: Activity, color: 'text-purple-400' },
  { id: 'running', icon: Footprints, color: 'text-green-400' },
  { id: 'cycling', icon: Bike, color: 'text-blue-400' },
  { id: 'swimming', icon: Waves, color: 'text-cyan-400' },
  { id: 'other', icon: Dumbbell, color: 'text-gray-400' },
];

// Timing presets
const TIMING_PRESETS = [
  { id: 'now', minutes: 0, label: 'Jetzt' },
  { id: 'in30min', minutes: 30, label: '+30min' },
  { id: 'in1h', minutes: 60, label: '+1h' },
];

// Duration presets
const DURATION_PRESETS = [30, 45, 60, 90];

export default function WorkoutPage() {
  const { userId, isLoading: userLoading } = useAnonymousUser();
  const t = useTranslations('workout');
  const router = useRouter();
  
  // Workout State
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [selectedType, setSelectedType] = useState<WorkoutType | null>(null);
  const [selectedTiming, setSelectedTiming] = useState<number>(0);
  const [selectedDuration, setSelectedDuration] = useState<number>(45);
  const [isStarting, setIsStarting] = useState(false);
  
  // Custom time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [customTime, setCustomTime] = useState<string>('');
  const [useCustomTime, setUseCustomTime] = useState(false);
  
  // Custom duration input state
  const [showDurationInput, setShowDurationInput] = useState(false);
  const [customDurationHours, setCustomDurationHours] = useState<string>('0');
  const [customDurationMinutes, setCustomDurationMinutes] = useState<string>('45');
  
  // Supplements State
  const [userStack, setUserStack] = useState<StackItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Hydration State
  const [hydrationMl, setHydrationMl] = useState(0);
  const [bodyWeightKg, setBodyWeightKg] = useState<number>(70); // Default 70kg
  
  // Timer State
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  
  // Dynamic hydration goal based on actual elapsed time and body weight
  const elapsedMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
  const hydrationGoal = calculateHydrationGoal(activeWorkout, elapsedMinutes, bodyWeightKg);
  
  // Phase Supplements State
  const [phaseSupplements, setPhaseSupplements] = useState<WorkoutSupplementRecommendation[]>([]);
  const [libraryRecommendations, setLibraryRecommendations] = useState<WorkoutSupplementRecommendation[]>([]);
  const [hydrationSupplements, setHydrationSupplements] = useState<HydrationSupplement[]>([]);
  
  // Adding supplement state
  const [addingSupplementId, setAddingSupplementId] = useState<string | null>(null);

  // Load user stack
  useEffect(() => {
    if (userId) {
      getUserStack(userId).then(stack => {
        const enrichedStack = stack.map(item => {
          if (item.supplement) return item;
          const supplement = SUPPLEMENT_LIBRARY.find(s => s.id === item.supplement_id);
          return { ...item, supplement: supplement || undefined };
        });
        setUserStack(enrichedStack);
        setLoading(false);
      });
    }
  }, [userId]);

  // Load active workout from localStorage
  useEffect(() => {
    const stored = getStoredWorkout();
    if (stored) {
      setActiveWorkout(stored);
    }
  }, []);
  
  // Update phase supplements and recommendations when workout or stack changes
  useEffect(() => {
    if (activeWorkout) {
      // Get supplements from user's stack
      const supplements = getPhaseSupplements(userStack, activeWorkout.phase);
      setPhaseSupplements(supplements);
      
      // Get recommendations from library (supplements user doesn't have)
      const existingIds = userStack.map(s => s.supplement_id);
      const recommendations = getLibraryRecommendations(activeWorkout.phase, existingIds);
      setLibraryRecommendations(recommendations);
      
      // Get hydration recommendations
      const hydrationRecs = getHydrationRecommendations(activeWorkout.type, activeWorkout.estimatedDuration);
      setHydrationSupplements(hydrationRecs);
    } else {
      setPhaseSupplements([]);
      setLibraryRecommendations([]);
      setHydrationSupplements([]);
    }
  }, [activeWorkout, userStack]);

  // Timer effect
  useEffect(() => {
    if (!activeWorkout) return;
    
    // In post phase, update only once per minute for "X minutes ago" display
    const intervalMs = activeWorkout.phase === 'post' ? 60000 : 1000;
    
    const updateTimer = () => {
      const startTime = new Date(activeWorkout.startTime).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
      
      // Don't auto-update phase if already in 'post' (manually ended)
      if (activeWorkout.phase === 'post') return;
      
      // Update phase based on time
      const elapsedMinutes = elapsed / 60;
      let newPhase: WorkoutPhase = activeWorkout.phase;
      
      if (elapsedMinutes < 0) {
        newPhase = 'pre';
      } else if (elapsedMinutes < activeWorkout.estimatedDuration) {
        newPhase = 'intra';
      } else {
        // Auto-transition to post when time is up
        newPhase = 'post';
      }
      
      if (newPhase !== activeWorkout.phase) {
        const updated = { ...activeWorkout, phase: newPhase };
        setActiveWorkout(updated);
        localStorage.setItem('active_workout', JSON.stringify(updated));
      }
    };
    
    // Initial update
    updateTimer();
    
    const interval = setInterval(updateTimer, intervalMs);
    
    return () => clearInterval(interval);
  }, [activeWorkout]);

  // Load hydration from localStorage
  useEffect(() => {
    setHydrationMl(getTodayHydration());
  }, []);
  
  // Load body weight from localStorage/profile
  useEffect(() => {
    const savedWeight = localStorage.getItem('user_body_weight');
    if (savedWeight) {
      const weight = parseFloat(savedWeight);
      if (weight > 0 && weight < 300) {
        setBodyWeightKg(weight);
      }
    }
  }, []);

  // Calculate minutes until custom time
  const getMinutesUntilCustomTime = useCallback((timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const target = new Date();
    target.setHours(hours, minutes, 0, 0);
    
    // If time is in the past, assume tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }
    
    return Math.round((target.getTime() - now.getTime()) / 1000 / 60);
  }, []);

  const startWorkout = useCallback(() => {
    if (!selectedType || !userId) return;
    
    setIsStarting(true);
    
    const timingMinutes = useCustomTime && customTime 
      ? getMinutesUntilCustomTime(customTime)
      : selectedTiming;
    
    const workout = startStoredWorkout(userId, selectedType, timingMinutes, selectedDuration);
    setActiveWorkout(workout);
    setIsStarting(false);
    
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
  }, [selectedType, selectedTiming, selectedDuration, userId, useCustomTime, customTime, getMinutesUntilCustomTime]);

  const endWorkout = useCallback(() => {
    if (!activeWorkout) return;
    
    // Immediately update UI
    const now = Date.now();
    const startTime = new Date(activeWorkout.startTime).getTime();
    const actualDuration = Math.max(1, Math.floor((now - startTime) / 1000 / 60));
    
    const updated: ActiveWorkout = {
      ...activeWorkout,
      phase: 'post',
      estimatedDuration: actualDuration,
    };
    
    // Update state immediately for instant UI feedback
    setActiveWorkout(updated);
    
    // Persist to storage
    localStorage.setItem('active_workout', JSON.stringify(updated));
    endStoredWorkout();
    
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }, [activeWorkout]);

  const clearWorkout = useCallback(() => {
    clearStoredWorkout();
    setActiveWorkout(null);
    setSelectedType(null);
    setElapsedSeconds(0);
  }, []);

  const addHydration = useCallback((ml: number) => {
    const newMl = addStoredHydration(ml);
    setHydrationMl(newMl);
    if (navigator.vibrate) navigator.vibrate(20);
  }, []);
  
  const handleAddSupplement = useCallback(async (supplementId: string) => {
    if (!userId) return;
    
    setAddingSupplementId(supplementId);
    try {
      const supplement = SUPPLEMENT_LIBRARY.find(s => s.id === supplementId);
      if (supplement) {
        await addToStack(userId, supplementId, supplement.best_time || 'morning');
        // Refresh stack
        const stack = await getUserStack(userId);
        const enrichedStack = stack.map(item => {
          if (item.supplement) return item;
          const supp = SUPPLEMENT_LIBRARY.find(s => s.id === item.supplement_id);
          return { ...item, supplement: supp || undefined };
        });
        setUserStack(enrichedStack);
        if (navigator.vibrate) navigator.vibrate(30);
      }
    } catch (error) {
      console.error('Failed to add supplement:', error);
    } finally {
      setAddingSupplementId(null);
    }
  }, [userId]);

  const formatTime = (seconds: number) => {
    const absSeconds = Math.abs(seconds);
    const h = Math.floor(absSeconds / 3600);
    const m = Math.floor((absSeconds % 3600) / 60);
    const s = absSeconds % 60;
    
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${mins} min`;
  };

  if (userLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen pb-28">
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28">
      {/* Header */}
      <header className="px-6 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>

      <main data-tour-id="workout-main" className="flex-1 px-6 space-y-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!activeWorkout ? (
            // ========================================
            // NO ACTIVE WORKOUT - Selection UI
            // ========================================
            <motion.div
              key="no-workout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Workout Type Selection */}
              <section className="glass-panel rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Trainingsart
                </h3>
                <div className="grid grid-cols-4 gap-3">
                  {WORKOUT_TYPES.map(({ id, icon: Icon, color }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelectedType(id)}
                      className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-xl transition-all",
                        selectedType === id
                          ? "bg-primary/20 border-2 border-primary"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      )}
                    >
                      <div className={cn("w-8 h-8 flex items-center justify-center", color)}>
                        <Icon size={24} />
                      </div>
                      <span className="text-[10px] font-medium text-foreground">
                        {t(`workoutTypes.${id}`)}
                      </span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Timing Selection - Presets + Custom Time */}
              <section className="glass-panel rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  Wann?
                </h3>
                <div className="flex gap-2 mb-3">
                  {TIMING_PRESETS.map(({ id, minutes, label }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setSelectedTiming(minutes);
                        setUseCustomTime(false);
                      }}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                        !useCustomTime && selectedTiming === minutes
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/5 text-foreground hover:bg-white/10"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowTimePicker(true)}
                    className={cn(
                      "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-1.5",
                      useCustomTime
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/5 text-foreground hover:bg-white/10"
                    )}
                  >
                    <Clock size={14} />
                    {useCustomTime && customTime ? customTime : 'Uhrzeit'}
                  </button>
                </div>
                
                {/* Time Picker Modal */}
                <AnimatePresence>
                  {showTimePicker && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                        <Clock size={16} className="text-muted-foreground" />
                        <input
                          type="time"
                          value={customTime}
                          onChange={(e) => setCustomTime(e.target.value)}
                          className="flex-1 bg-transparent text-foreground text-lg font-mono focus:outline-none"
                        />
                        <button
                          onClick={() => {
                            if (customTime) {
                              setUseCustomTime(true);
                            }
                            setShowTimePicker(false);
                          }}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => {
                            setShowTimePicker(false);
                            setCustomTime('');
                            setUseCustomTime(false);
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </section>

              {/* Duration Selection - Presets + Slider + Manual Input */}
              <section className="glass-panel rounded-2xl p-5 border border-white/5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('duration.title')}
                  </h3>
                  <span className="text-lg font-bold text-primary">
                    {formatDuration(selectedDuration)}
                  </span>
                </div>
                
                {/* Quick Presets + Manual Input Button */}
                <div className="flex gap-2 mb-4">
                  {DURATION_PRESETS.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => {
                        setSelectedDuration(mins);
                        setShowDurationInput(false);
                      }}
                      className={cn(
                        "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all",
                        !showDurationInput && selectedDuration === mins
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/5 text-foreground hover:bg-white/10"
                      )}
                    >
                      {mins}min
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setShowDurationInput(true);
                      const hours = Math.floor(selectedDuration / 60);
                      const mins = selectedDuration % 60;
                      setCustomDurationHours(hours.toString());
                      setCustomDurationMinutes(mins.toString());
                    }}
                    className={cn(
                      "w-10 h-10 rounded-xl transition-all flex items-center justify-center",
                      showDurationInput || selectedDuration > 90
                        ? "bg-primary text-primary-foreground"
                        : "bg-white/5 text-foreground hover:bg-white/10"
                    )}
                  >
                    <Clock size={16} />
                  </button>
                </div>
                
                {/* Manual Duration Input */}
                <AnimatePresence>
                  {showDurationInput && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-4"
                    >
                      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-xl">
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={customDurationHours}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 24)) {
                                setCustomDurationHours(val);
                              }
                            }}
                            className="w-14 bg-white/10 text-foreground text-xl font-mono focus:outline-none text-center rounded-xl py-2.5 border border-white/10 focus:border-primary/50 transition-colors"
                          />
                          <span className="text-muted-foreground text-sm">h</span>
                        </div>
                        <span className="text-muted-foreground/50 text-2xl font-light">:</span>
                        <div className="flex items-center gap-1.5 flex-1">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={2}
                            value={customDurationMinutes}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                                setCustomDurationMinutes(val);
                              }
                            }}
                            className="w-14 bg-white/10 text-foreground text-xl font-mono focus:outline-none text-center rounded-xl py-2.5 border border-white/10 focus:border-primary/50 transition-colors"
                          />
                          <span className="text-muted-foreground text-sm">min</span>
                        </div>
                        <button
                          onClick={() => {
                            const hours = parseInt(customDurationHours) || 0;
                            const mins = parseInt(customDurationMinutes) || 0;
                            const totalMins = hours * 60 + mins;
                            if (totalMins >= 15 && totalMins <= 1440) {
                              setSelectedDuration(totalMins);
                            }
                            setShowDurationInput(false);
                          }}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
                        >
                          OK
                        </button>
                        <button
                          onClick={() => setShowDurationInput(false)}
                          className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 text-center mt-2">
                        Max. 24 Stunden
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
                
                {/* Duration Slider - only show if not in manual input mode */}
                {!showDurationInput && (
                  <>
                    <div className="space-y-2">
                      <input
                        type="range"
                        min={15}
                        max={240}
                        step={5}
                        value={Math.min(selectedDuration, 240)}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>15min</span>
                        <span>1h</span>
                        <span>2h</span>
                        <span>3h</span>
                        <span>4h</span>
                      </div>
                    </div>
                    
                    {/* Fine-tune buttons */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        type="button"
                        onClick={() => setSelectedDuration(Math.max(15, selectedDuration - 5))}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-foreground hover:bg-white/20"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-2xl font-mono font-bold text-foreground w-28 text-center">
                        {selectedDuration > 240 ? formatDuration(selectedDuration) : `${selectedDuration} min`}
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedDuration(selectedDuration + 5)}
                        className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-foreground hover:bg-white/20"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </>
                )}
              </section>

              {/* Start Button */}
              <motion.button
                onClick={startWorkout}
                disabled={!selectedType || isStarting}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all",
                  selectedType
                    ? "bg-gradient-to-r from-primary to-green-500 text-primary-foreground shadow-lg shadow-primary/20"
                    : "bg-white/10 text-muted-foreground cursor-not-allowed"
                )}
              >
                {isStarting ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Play size={24} fill="currentColor" />
                    {t('startWorkout')}
                  </>
                )}
              </motion.button>
            </motion.div>
          ) : (
            // ========================================
            // ACTIVE WORKOUT - Timer & Supplements UI
            // ========================================
            <motion.div
              key="active-workout"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Phase Indicator & Timer with integrated Hydration */}
              <section className="glass-panel rounded-2xl p-6 border border-primary/30 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
                
                <div className="relative z-10">
                  {/* Top Row: Phase Badge + Workout Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold",
                      activeWorkout.phase === 'pre' && "bg-yellow-500/20 text-yellow-400",
                      activeWorkout.phase === 'intra' && "bg-green-500/20 text-green-400",
                      activeWorkout.phase === 'post' && "bg-blue-500/20 text-blue-400"
                    )}>
                      {activeWorkout.phase !== 'post' && (
                        <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                      )}
                      {activeWorkout.phase === 'post' && (
                        <Check size={12} />
                      )}
                      {t(`phases.${activeWorkout.phase}`)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t(`workoutTypes.${activeWorkout.type}`)} • {formatDuration(activeWorkout.estimatedDuration)}
                    </div>
                  </div>
                  
                  {/* Timer - different display for post phase */}
                  <div className="text-center mb-5">
                    {activeWorkout.phase === 'post' ? (
                      <>
                        <div className="text-2xl font-bold text-foreground mb-1">
                          Training beendet
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {(() => {
                            const mins = Math.max(1, Math.floor((elapsedSeconds - activeWorkout.estimatedDuration * 60) / 60));
                            return `vor ${mins} ${mins === 1 ? 'Minute' : 'Minuten'}`;
                          })()}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-5xl font-mono font-bold text-foreground">
                          {elapsedSeconds < 0 ? '-' : ''}{formatTime(elapsedSeconds)}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {elapsedSeconds < 0 
                            ? t('timer.startsIn') 
                            : t('timer.elapsed')
                          }
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Integrated Hydration */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Droplets size={16} className="text-cyan-400" />
                        <span className="text-xs font-medium text-muted-foreground">Hydration</span>
                      </div>
                      <span className="text-xs text-cyan-400 font-bold">
                        {hydrationMl} / {hydrationGoal}ml
                      </span>
                    </div>
                    
                    {/* Compact Progress Bar */}
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-3">
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((hydrationMl / hydrationGoal) * 100, 100)}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    
                    {/* Quick Add/Remove Buttons */}
                    <div className="flex gap-2 mb-2">
                      {/* Remove button - only show if hydration > 0 */}
                      {hydrationMl > 0 && (
                        <button
                          onClick={() => addHydration(-250)}
                          className="py-2 px-4 rounded-xl bg-white/5 text-muted-foreground text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                        >
                          <Minus size={14} />
                          250ml
                        </button>
                      )}
                      
                      {/* Add buttons */}
                      <button
                        onClick={() => addHydration(250)}
                        className="flex-1 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Plus size={14} />
                        250ml
                      </button>
                      <button
                        onClick={() => addHydration(500)}
                        className="flex-1 py-2 rounded-xl bg-cyan-500/20 text-cyan-400 text-sm font-medium flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Plus size={14} />
                        500ml
                      </button>
                    </div>
                    
                    {/* Disclaimer */}
                    <p className="text-[10px] text-muted-foreground/60 text-center">
                      Basierend auf ACSM-Richtlinien ({bodyWeightKg}kg). Bei Hitze oder starkem Schwitzen mehr trinken.
                    </p>
                  </div>
                </div>
              </section>

              {/* End/Clear Workout Buttons */}
              <div className="flex gap-3">
                {activeWorkout.phase === 'intra' && (
                  <button
                    onClick={endWorkout}
                    className="flex-1 py-3.5 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 font-medium flex items-center justify-center gap-2"
                  >
                    <Square size={16} fill="currentColor" />
                    {t('endWorkout')}
                  </button>
                )}
                {activeWorkout.phase === 'post' && (
                  <button
                    onClick={clearWorkout}
                    className="flex-1 py-3.5 rounded-xl bg-white/10 text-foreground font-medium flex items-center justify-center gap-2"
                  >
                    <Check size={16} />
                    Fertig
                  </button>
                )}
              </div>

              {/* Phase Supplements from Stack */}
              <section className="glass-panel rounded-2xl p-5 border border-white/5">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  {t(`supplements.${activeWorkout.phase === 'pre' ? 'pre' : activeWorkout.phase === 'intra' ? 'intra' : 'post'}Workout`)}
                </h3>
                
                {phaseSupplements.length > 0 ? (
                  <div className="space-y-2">
                    {phaseSupplements.map(supp => (
                      <div 
                        key={supp.supplementId}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl",
                          supp.priority === 'essential' ? "bg-primary/10 border border-primary/20" :
                          supp.priority === 'recommended' ? "bg-white/10 border border-white/10" :
                          "bg-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className={cn(
                            "w-10 h-10 flex-shrink-0 rounded-xl flex items-center justify-center",
                            supp.priority === 'essential' ? "bg-primary/20" : "bg-white/10"
                          )}>
                            <Pill size={18} className={supp.priority === 'essential' ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground text-sm flex items-center gap-2">
                              <span className="truncate">{supp.supplementName}</span>
                              {supp.priority === 'essential' && (
                                <span className="flex-shrink-0 text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-bold">
                                  WICHTIG
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {supp.dosage} • {supp.timing}
                            </div>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground flex-shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {t('supplements.noSupplements')}
                  </p>
                )}
              </section>
              
              {/* Library Recommendations */}
              {libraryRecommendations.length > 0 && (
                <section className="glass-panel rounded-2xl p-5 border border-amber-500/20">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Lightbulb size={14} />
                    Empfehlungen
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Diese Supplements könnten dein Training verbessern:
                  </p>
                  <div className="space-y-2">
                    {libraryRecommendations.map(supp => (
                      <div 
                        key={supp.supplementId}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-dashed border-white/10"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <Pill size={18} className="text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-foreground text-sm truncate">
                              {supp.supplementName}
                            </div>
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {supp.reason}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddSupplement(supp.supplementId)}
                          disabled={addingSupplementId === supp.supplementId}
                          className="ml-3 flex-shrink-0 px-3 py-1.5 bg-primary/20 text-primary border border-primary/30 rounded-xl text-xs font-medium flex items-center gap-1.5 hover:bg-primary/30 disabled:opacity-50"
                        >
                          {addingSupplementId === supp.supplementId ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Plus size={12} />
                          )}
                          Hinzufügen
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Hydration Supplements - only show if there are recommendations */}
              {hydrationSupplements.length > 0 && (
                <section className="glass-panel rounded-2xl p-5 border border-cyan-500/20">
                  <h3 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Droplets size={14} />
                    Zum Wasser hinzufügen
                  </h3>
                  <div className="space-y-2">
                    {hydrationSupplements.map(supp => {
                      const IconComponent = HYDRATION_ICONS[supp.icon] || Droplets;
                      return (
                        <div 
                          key={supp.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/10"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                              <IconComponent size={18} className="text-cyan-400" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-foreground text-sm truncate">
                                {supp.name}
                              </div>
                              <div className="text-xs text-muted-foreground truncate">
                                {supp.amount}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-cyan-400 max-w-[140px] text-right flex-shrink-0 ml-3">
                            {supp.reason}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <BottomNav />
    </div>
  );
}
