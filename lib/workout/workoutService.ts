/**
 * Workout Service
 * 
 * Manages workout scheduling, detection, and phase tracking.
 * Supports manual activation and wearable integration.
 */

import { 
  WorkoutType, 
  WorkoutPhase, 
  ScheduledWorkout, 
  DetectedWorkout,
  ActiveWorkout 
} from '@/types';

const STORAGE_KEY = 'active_workout';
const HISTORY_KEY = 'workout_history';

// ============================================
// ACTIVE WORKOUT MANAGEMENT
// ============================================

/**
 * Start a new workout (manual activation)
 */
export function startWorkout(
  userId: string,
  type: WorkoutType,
  startsInMinutes: number = 0,
  estimatedDuration: number = 45
): ActiveWorkout {
  const startTime = new Date(Date.now() + startsInMinutes * 60 * 1000);
  
  const workout: ActiveWorkout = {
    id: `workout_${Date.now()}`,
    type,
    startTime: startTime.toISOString(),
    estimatedDuration,
    phase: startsInMinutes > 0 ? 'pre' : 'intra',
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workout));
  }
  
  return workout;
}

/**
 * End the current workout (moves to post phase)
 */
export function endWorkout(): ActiveWorkout | null {
  const workout = getActiveWorkout();
  if (!workout) return null;
  
  const now = new Date();
  const actualDuration = Math.floor(
    (now.getTime() - new Date(workout.startTime).getTime()) / 1000 / 60
  );
  
  const updated: ActiveWorkout = {
    ...workout,
    phase: 'post',
    estimatedDuration: Math.max(actualDuration, 1),
  };
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    
    // Save to history
    saveToHistory(updated);
  }
  
  return updated;
}

/**
 * Clear the current workout completely
 */
export function clearWorkout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Get the currently active workout (if any)
 */
export function getActiveWorkout(): ActiveWorkout | null {
  if (typeof window === 'undefined') return null;
  
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  
  try {
    const workout = JSON.parse(saved) as ActiveWorkout;
    
    // Check if workout has expired (more than 2h after estimated end)
    const startTime = new Date(workout.startTime).getTime();
    const endTime = startTime + workout.estimatedDuration * 60 * 1000;
    const postWindowEnd = endTime + 2 * 60 * 60 * 1000; // 2h after
    
    if (Date.now() > postWindowEnd) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    // Update phase based on current time
    const updatedWorkout = updateWorkoutPhase(workout);
    if (updatedWorkout.phase !== workout.phase) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedWorkout));
    }
    
    return updatedWorkout;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

/**
 * Update workout phase based on current time
 */
export function updateWorkoutPhase(workout: ActiveWorkout): ActiveWorkout {
  const now = Date.now();
  const startTime = new Date(workout.startTime).getTime();
  const endTime = startTime + workout.estimatedDuration * 60 * 1000;
  
  let phase: WorkoutPhase;
  
  if (now < startTime) {
    phase = 'pre';
  } else if (now < endTime) {
    phase = 'intra';
  } else {
    phase = 'post';
  }
  
  return { ...workout, phase };
}

// ============================================
// PHASE CALCULATION
// ============================================

/**
 * Get current phase details for an active workout
 */
export function getCurrentPhaseDetails(workout: ActiveWorkout | null): {
  phase: WorkoutPhase;
  minutesUntilStart?: number;
  minutesSinceStart?: number;
  minutesUntilEnd?: number;
  minutesSinceEnd?: number;
} {
  if (!workout) {
    return { phase: 'rest' };
  }
  
  const now = Date.now();
  const startTime = new Date(workout.startTime).getTime();
  const endTime = startTime + workout.estimatedDuration * 60 * 1000;
  
  if (now < startTime) {
    return {
      phase: 'pre',
      minutesUntilStart: Math.ceil((startTime - now) / 1000 / 60),
    };
  }
  
  if (now < endTime) {
    return {
      phase: 'intra',
      minutesSinceStart: Math.floor((now - startTime) / 1000 / 60),
      minutesUntilEnd: Math.ceil((endTime - now) / 1000 / 60),
    };
  }
  
  return {
    phase: 'post',
    minutesSinceEnd: Math.floor((now - endTime) / 1000 / 60),
  };
}

// ============================================
// WORKOUT HISTORY
// ============================================

/**
 * Save a completed workout to history
 */
function saveToHistory(workout: ActiveWorkout): void {
  const history = getWorkoutHistory();
  
  const detected: DetectedWorkout = {
    id: workout.id,
    userId: '', // Will be set by caller if needed
    startTime: workout.startTime,
    endTime: new Date(
      new Date(workout.startTime).getTime() + workout.estimatedDuration * 60 * 1000
    ).toISOString(),
    type: workout.type,
    durationMinutes: workout.estimatedDuration,
    source: 'manual',
  };
  
  history.push(detected);
  
  // Keep only last 30 workouts
  const trimmed = history.slice(-30);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
}

/**
 * Get workout history
 */
export function getWorkoutHistory(): DetectedWorkout[] {
  if (typeof window === 'undefined') return [];
  
  const saved = localStorage.getItem(HISTORY_KEY);
  if (!saved) return [];
  
  try {
    return JSON.parse(saved) as DetectedWorkout[];
  } catch {
    return [];
  }
}

/**
 * Get recent workouts for a time period
 */
export function getRecentWorkouts(days: number = 7): DetectedWorkout[] {
  const history = getWorkoutHistory();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  
  return history.filter(w => new Date(w.startTime).getTime() > cutoff);
}

// ============================================
// WORKOUT PREDICTIONS
// ============================================

/**
 * Predict likely next workout based on history
 */
export function predictNextWorkout(): {
  likelyType: WorkoutType;
  likelyTime: string;
  confidence: number;
} | null {
  const history = getRecentWorkouts(14);
  if (history.length < 3) return null;
  
  // Find most common workout type
  const typeCounts = new Map<WorkoutType, number>();
  history.forEach(w => {
    typeCounts.set(w.type, (typeCounts.get(w.type) || 0) + 1);
  });
  
  let maxCount = 0;
  let likelyType: WorkoutType = 'strength';
  typeCounts.forEach((count, type) => {
    if (count > maxCount) {
      maxCount = count;
      likelyType = type;
    }
  });
  
  // Find most common time of day
  const hourCounts = new Map<number, number>();
  history.forEach(w => {
    const hour = new Date(w.startTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });
  
  let maxHourCount = 0;
  let likelyHour = 9;
  hourCounts.forEach((count, hour) => {
    if (count > maxHourCount) {
      maxHourCount = count;
      likelyHour = hour;
    }
  });
  
  // Create prediction for tomorrow at likely hour
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(likelyHour, 0, 0, 0);
  
  const confidence = Math.min(history.length / 10, 0.9);
  
  return {
    likelyType,
    likelyTime: tomorrow.toISOString(),
    confidence,
  };
}

// ============================================
// HYDRATION TRACKING
// ============================================

const HYDRATION_KEY = 'hydration_today';

interface HydrationData {
  date: string;
  ml: number;
}

/**
 * Get today's hydration amount
 */
export function getTodayHydration(): number {
  if (typeof window === 'undefined') return 0;
  
  const saved = localStorage.getItem(HYDRATION_KEY);
  if (!saved) return 0;
  
  try {
    const data = JSON.parse(saved) as HydrationData;
    const today = new Date().toDateString();
    
    if (data.date === today) {
      return data.ml;
    }
    
    // Reset for new day
    return 0;
  } catch {
    return 0;
  }
}

/**
 * Add or remove hydration amount
 * Negative values allowed but total won't go below 0
 */
export function addHydration(ml: number): number {
  const current = getTodayHydration();
  const newTotal = Math.max(0, current + ml); // Prevent negative values
  
  if (typeof window !== 'undefined') {
    const data: HydrationData = {
      date: new Date().toDateString(),
      ml: newTotal,
    };
    localStorage.setItem(HYDRATION_KEY, JSON.stringify(data));
  }
  
  return newTotal;
}

/**
 * Reset today's hydration
 */
export function resetHydration(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(HYDRATION_KEY);
  }
}

/**
 * Calculate hydration goal based on workout
 * Based on ACSM guidelines: ~0.4-0.8L per hour, adjusted for body weight
 * 
 * @param workout - Active workout or null
 * @param elapsedMinutes - Optional: actual elapsed minutes (for dynamic calculation)
 * @param bodyWeightKg - Optional: body weight in kg (default 70kg)
 */
export function calculateHydrationGoal(
  workout: ActiveWorkout | null, 
  elapsedMinutes?: number,
  bodyWeightKg: number = 70
): number {
  // Base: ~7ml per kg body weight pre-workout (ACSM recommendation)
  const baseGoal = Math.round(bodyWeightKg * 7); // ~500ml for 70kg
  
  if (!workout) return Math.round(bodyWeightKg * 30); // ~2.1L daily for 70kg
  
  // Use actual elapsed time if provided, otherwise use estimated duration
  let effectiveMinutes = 0;
  
  if (workout.phase === 'pre') {
    effectiveMinutes = 0;
  } else if (elapsedMinutes !== undefined && elapsedMinutes > 0) {
    effectiveMinutes = elapsedMinutes;
  } else {
    effectiveMinutes = workout.estimatedDuration;
  }
  
  // Base rate: ~10ml per kg per hour (ACSM mid-range)
  // Adjusted by workout intensity
  const baseRatePerKgPerHour = 10;
  let intensityMultiplier = 1.0;
  
  switch (workout.type) {
    case 'hiit':
    case 'running':
      intensityMultiplier = 1.4; // High sweat rate
      break;
    case 'cycling':
    case 'cardio':
      intensityMultiplier = 1.2;
      break;
    case 'strength':
    case 'swimming':
      intensityMultiplier = 1.0;
      break;
    case 'yoga':
      intensityMultiplier = 0.5;
      break;
    default:
      intensityMultiplier = 0.8;
  }
  
  // Calculate ml per minute for this person
  const mlPerMinute = (bodyWeightKg * baseRatePerKgPerHour * intensityMultiplier) / 60;
  
  // During workout hydration
  const duringWorkout = Math.round(effectiveMinutes * mlPerMinute);
  
  // Post-workout: ~150% of estimated sweat loss for rehydration
  const postRecovery = workout.phase === 'post' ? Math.round(bodyWeightKg * 7) : 0;
  
  return baseGoal + duringWorkout + postRecovery;
}
