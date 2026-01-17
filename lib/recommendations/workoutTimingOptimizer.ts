/**
 * Workout Timing Optimizer
 * 
 * Generates supplement recommendations based on workout phase.
 * Filters user's stack for workout-relevant supplements and provides
 * timing-specific guidance.
 */

import { WorkoutPhase, WorkoutSupplementTiming, ActiveWorkout } from '@/types';
import { Supplement, SUPPLEMENT_LIBRARY } from '@/data/supplements';
import { StackItem } from '@/lib/supabaseService';

export interface WorkoutSupplementRecommendation {
  supplementId: string;
  supplementName: string;
  emoji: string;
  dosage: string;
  phase: WorkoutPhase;
  timing: string;  // e.g., "30 min before", "during", "within 30 min after"
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
}

// Default workout timing data for supplements that don't have it explicitly defined
const DEFAULT_WORKOUT_TIMINGS: Record<string, WorkoutSupplementTiming> = {
  // Pre-Workout
  'caffeine': { phase: ['pre'], minutesBefore: 60, reason: 'Peak alertness and performance' },
  'citrulline': { phase: ['pre'], minutesBefore: 30, reason: 'Peak nitric oxide for blood flow' },
  'citrulline-malate': { phase: ['pre'], minutesBefore: 30, reason: 'Enhanced pumps and endurance' },
  'beta-alanine': { phase: ['pre'], minutesBefore: 30, reason: 'Buffer lactic acid buildup' },
  'tyrosine': { phase: ['pre'], minutesBefore: 45, reason: 'Dopamine precursor for focus' },
  'alpha-gpc': { phase: ['pre'], minutesBefore: 45, reason: 'Acetylcholine for mind-muscle connection' },
  'cordyceps': { phase: ['pre'], minutesBefore: 30, reason: 'Enhanced oxygen utilization' },
  'rhodiola': { phase: ['pre'], minutesBefore: 60, reason: 'Reduce perceived exertion' },
  'alcar': { phase: ['pre'], minutesBefore: 30, reason: 'Mental energy and fat oxidation' },
  'agmatine': { phase: ['pre'], minutesBefore: 30, reason: 'Enhanced pumps and mood' },
  'betaine': { phase: ['pre'], minutesBefore: 30, reason: 'Power output and hydration' },
  'peak-o2': { phase: ['pre'], minutesBefore: 30, reason: 'Oxygen utilization and endurance' },
  'glycerol': { phase: ['pre'], minutesBefore: 30, reason: 'Hyperhydration for pumps' },
  'l-arginine': { phase: ['pre'], minutesBefore: 30, reason: 'Nitric oxide for blood flow' },
  'aakg': { phase: ['pre'], minutesBefore: 30, reason: 'Sustained nitric oxide production' },
  
  // Intra-Workout
  'bcaa': { phase: ['intra'], reason: 'Prevent muscle catabolism during training' },
  'eaa': { phase: ['intra'], reason: 'Complete amino acid support during training' },
  'electrolytes': { phase: ['intra'], reason: 'Maintain hydration and muscle function' },
  'l-leucine': { phase: ['intra'], reason: 'Stimulate protein synthesis during training' },
  'l-isoleucine': { phase: ['intra'], reason: 'Energy and glucose uptake during training' },
  'l-valine': { phase: ['intra'], reason: 'Prevent muscle breakdown' },
  'l-alanine': { phase: ['intra'], reason: 'Glucose production during prolonged exercise' },
  
  // Post-Workout
  'creatine': { phase: ['post'], minutesAfter: 30, reason: 'Enhanced uptake with post-workout shake' },
  'l-glutamine': { phase: ['post'], minutesAfter: 30, reason: 'Muscle recovery and gut health' },
  'carnitine-tartrate': { phase: ['post'], minutesAfter: 30, reason: 'Recovery and androgen receptor density' },
  'tart-cherry': { phase: ['post'], minutesAfter: 60, reason: 'Reduce inflammation and muscle soreness' },
  'hmb': { phase: ['post'], minutesAfter: 30, reason: 'Prevent muscle breakdown' },
  'collagen': { phase: ['post'], minutesAfter: 60, reason: 'Joint and connective tissue recovery' },
  'phosphatidylserine': { phase: ['post'], minutesAfter: 30, reason: 'Reduce cortisol and support recovery' },
  'magnesium': { phase: ['post'], minutesAfter: 60, reason: 'Muscle relaxation and recovery' },
  'zinc': { phase: ['post'], minutesAfter: 60, reason: 'Hormone support and recovery' },
  'vitamin-c': { phase: ['post'], minutesAfter: 30, reason: 'Antioxidant support after training' },
  'curcumin': { phase: ['post'], minutesAfter: 60, reason: 'Reduce inflammation' },
  'omega-3': { phase: ['post'], minutesAfter: 60, reason: 'Anti-inflammatory support' },
  'l-ornithine': { phase: ['post'], minutesAfter: 30, reason: 'Reduce ammonia and support recovery' },
  
  // Multi-phase
  'coq10': { phase: ['pre', 'post'], minutesBefore: 30, minutesAfter: 30, reason: 'Mitochondrial energy support' },
  'pqq': { phase: ['pre', 'post'], minutesBefore: 30, minutesAfter: 30, reason: 'Mitochondrial biogenesis' },
};

/**
 * Get workout timing info for a supplement
 */
export function getWorkoutTiming(supplementId: string): WorkoutSupplementTiming | null {
  // Check default timings
  const idLower = supplementId.toLowerCase();
  
  for (const [key, timing] of Object.entries(DEFAULT_WORKOUT_TIMINGS)) {
    if (idLower.includes(key) || key.includes(idLower)) {
      return timing;
    }
  }
  
  return null;
}

/**
 * Check if a supplement is relevant for a specific workout phase
 */
export function isRelevantForPhase(supplementId: string, phase: WorkoutPhase): boolean {
  const timing = getWorkoutTiming(supplementId);
  if (!timing) return false;
  
  return timing.phase.includes(phase);
}

/**
 * Get supplements from user stack relevant for a workout phase
 */
export function getPhaseSupplements(
  userStack: StackItem[],
  phase: WorkoutPhase
): WorkoutSupplementRecommendation[] {
  const recommendations: WorkoutSupplementRecommendation[] = [];
  
  for (const item of userStack) {
    const supplementId = item.supplement_id;
    const timing = getWorkoutTiming(supplementId);
    
    if (!timing || !timing.phase.includes(phase)) continue;
    
    const supplement = item.supplement || SUPPLEMENT_LIBRARY.find(s => s.id === supplementId);
    if (!supplement) continue;
    
    let timingText: string;
    if (phase === 'pre' && timing.minutesBefore) {
      timingText = `${timing.minutesBefore} min vorher`;
    } else if (phase === 'post' && timing.minutesAfter) {
      timingText = `${timing.minutesAfter} min nachher`;
    } else if (phase === 'intra') {
      timingText = 'Während des Trainings';
    } else {
      timingText = phase === 'pre' ? 'Vor dem Training' : 'Nach dem Training';
    }
    
    recommendations.push({
      supplementId,
      supplementName: supplement.name,
      emoji: supplement.emoji || '💊',
      dosage: item.custom_dosage || supplement.optimal_dosage || '',
      phase,
      timing: timingText,
      priority: determinePriority(supplementId, phase),
      reason: timing.reason,
    });
  }
  
  // Sort by priority
  const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return recommendations;
}

/**
 * Determine priority of a supplement for a phase
 */
function determinePriority(
  supplementId: string,
  phase: WorkoutPhase
): 'essential' | 'recommended' | 'optional' {
  const id = supplementId.toLowerCase();
  
  // Essential supplements per phase
  const essential: Record<WorkoutPhase, string[]> = {
    pre: ['caffeine', 'citrulline', 'beta-alanine'],
    intra: ['eaa', 'bcaa', 'electrolytes'],
    post: ['creatine', 'glutamine', 'protein'],
    rest: [],
  };
  
  const recommended: Record<WorkoutPhase, string[]> = {
    pre: ['tyrosine', 'alpha-gpc', 'cordyceps', 'rhodiola'],
    intra: ['leucine', 'isoleucine', 'valine'],
    post: ['tart-cherry', 'magnesium', 'collagen', 'hmb'],
    rest: [],
  };
  
  if (essential[phase].some(e => id.includes(e))) {
    return 'essential';
  }
  
  if (recommended[phase].some(r => id.includes(r))) {
    return 'recommended';
  }
  
  return 'optional';
}

/**
 * Get complete workout supplement plan for all phases
 */
export function getWorkoutSupplementPlan(
  userStack: StackItem[],
  workout: ActiveWorkout
): {
  pre: WorkoutSupplementRecommendation[];
  intra: WorkoutSupplementRecommendation[];
  post: WorkoutSupplementRecommendation[];
} {
  return {
    pre: getPhaseSupplements(userStack, 'pre'),
    intra: getPhaseSupplements(userStack, 'intra'),
    post: getPhaseSupplements(userStack, 'post'),
  };
}

/**
 * Generate timing summary for a workout
 */
export function generateTimingSummary(
  workout: ActiveWorkout,
  plan: ReturnType<typeof getWorkoutSupplementPlan>
): string[] {
  const tips: string[] = [];
  const startTime = new Date(workout.startTime);
  
  // Pre-workout tips
  if (plan.pre.length > 0) {
    const earliest = Math.max(...plan.pre.map(s => {
      const timing = getWorkoutTiming(s.supplementId);
      return timing?.minutesBefore || 30;
    }));
    
    const takeTime = new Date(startTime.getTime() - earliest * 60 * 1000);
    tips.push(`Pre-Workout um ${takeTime.getHours()}:${takeTime.getMinutes().toString().padStart(2, '0')} nehmen`);
  }
  
  // Intra-workout tips
  if (plan.intra.length > 0) {
    tips.push(`${plan.intra.length} Supplements während des Trainings`);
  }
  
  // Post-workout tips
  if (plan.post.length > 0) {
    tips.push(`Post-Workout innerhalb von 30-60 Minuten nach dem Training`);
  }
  
  return tips;
}

/**
 * Get supplement recommendations from Library for a phase
 * Returns supplements the user doesn't have in their stack but would benefit from
 */
export function getLibraryRecommendations(
  phase: WorkoutPhase,
  existingSupplementIds: string[]
): WorkoutSupplementRecommendation[] {
  const recommendations: WorkoutSupplementRecommendation[] = [];
  const existingLower = existingSupplementIds.map(id => id.toLowerCase());
  
  // Go through all workout timing entries
  for (const [key, timing] of Object.entries(DEFAULT_WORKOUT_TIMINGS)) {
    if (!timing.phase.includes(phase)) continue;
    
    // Skip if user already has this supplement
    if (existingLower.some(id => id.includes(key) || key.includes(id))) continue;
    
    // Find matching supplement in library - more flexible matching
    const keyLower = key.toLowerCase();
    const supplement = SUPPLEMENT_LIBRARY.find(s => {
      const idLower = s.id.toLowerCase();
      const nameLower = s.name.toLowerCase();
      
      // Direct match
      if (idLower === keyLower || nameLower === keyLower) return true;
      
      // Partial match
      if (idLower.includes(keyLower) || keyLower.includes(idLower)) return true;
      if (nameLower.includes(keyLower)) return true;
      
      // Handle specific mappings
      if (keyLower === 'omega-3' && (idLower.includes('omega') || idLower.includes('fish-oil'))) return true;
      if (keyLower === 'vitamin-c' && idLower.includes('vitamin-c')) return true;
      
      return false;
    });
    
    if (!supplement) continue;
    
    // Already added this supplement
    if (recommendations.some(r => r.supplementId === supplement.id)) continue;
    
    let timingText: string;
    if (phase === 'pre' && timing.minutesBefore) {
      timingText = `${timing.minutesBefore} min vorher`;
    } else if (phase === 'post' && timing.minutesAfter) {
      timingText = `${timing.minutesAfter} min nachher`;
    } else if (phase === 'intra') {
      timingText = 'Während des Trainings';
    } else {
      timingText = phase === 'pre' ? 'Vor dem Training' : 'Nach dem Training';
    }
    
    recommendations.push({
      supplementId: supplement.id,
      supplementName: supplement.name,
      emoji: supplement.emoji || '💊',
      dosage: supplement.optimal_dosage || '',
      phase,
      timing: timingText,
      priority: determinePriority(supplement.id, phase),
      reason: timing.reason,
    });
  }
  
  // Sort by priority
  const priorityOrder = { essential: 0, recommended: 1, optional: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Limit to top recommendations
  return recommendations.slice(0, 6);
}
