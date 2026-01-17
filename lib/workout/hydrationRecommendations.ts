/**
 * Hydration Recommendations
 * 
 * Provides supplement recommendations for optimal hydration during workouts.
 */

import { WorkoutType } from '@/types';

// Icon types for hydration supplements
export type HydrationIconType = 'droplet' | 'zap' | 'sparkles' | 'leaf' | 'beaker' | 'cup' | 'dumbbell' | 'candy';

export interface HydrationSupplement {
  id: string;
  name: string;
  icon: HydrationIconType;
  amount: string;
  reason: string;
  workoutTypes?: WorkoutType[];  // If undefined, applies to all
}

export const HYDRATION_SUPPLEMENTS: HydrationSupplement[] = [
  { 
    id: 'salt', 
    name: 'Salz', 
    icon: 'droplet', 
    amount: '1/4 TL pro Liter', 
    reason: 'Natrium für Elektrolyt-Balance und Flüssigkeitsaufnahme' 
  },
  { 
    id: 'electrolytes', 
    name: 'Elektrolyte', 
    icon: 'zap', 
    amount: '1 Portion', 
    reason: 'Vollständiges Elektrolyt-Spektrum für optimale Hydration',
    workoutTypes: ['cardio', 'hiit', 'running', 'cycling', 'swimming']
  },
  { 
    id: 'magnesium', 
    name: 'Magnesium', 
    icon: 'sparkles', 
    amount: '200-400mg', 
    reason: 'Verhindert Muskelkrämpfe und unterstützt die Regeneration',
    workoutTypes: ['strength', 'hiit']
  },
  { 
    id: 'potassium', 
    name: 'Kalium', 
    icon: 'leaf', 
    amount: '200mg', 
    reason: 'Muskel- und Nervenfunktion, wichtig bei starkem Schwitzen',
    workoutTypes: ['cardio', 'hiit', 'running', 'cycling']
  },
  { 
    id: 'sodium-bicarbonate', 
    name: 'Natron', 
    icon: 'beaker', 
    amount: '0.2-0.3g pro kg', 
    reason: 'Puffert Laktatsäure bei intensivem Training',
    workoutTypes: ['hiit', 'running', 'cycling', 'swimming']
  },
  { 
    id: 'coconut-water', 
    name: 'Kokoswasser', 
    icon: 'cup', 
    amount: '250-500ml', 
    reason: 'Natürliche Elektrolyte und schnelle Rehydration' 
  },
  { 
    id: 'bcaa-intra', 
    name: 'BCAAs', 
    icon: 'dumbbell', 
    amount: '5-10g', 
    reason: 'Verhindert Muskelabbau während langer Trainingseinheiten',
    workoutTypes: ['strength', 'cardio', 'running', 'cycling']
  },
  { 
    id: 'dextrose', 
    name: 'Dextrose/Traubenzucker', 
    icon: 'candy', 
    amount: '20-40g pro Stunde', 
    reason: 'Schnelle Energie bei Ausdauertraining >60min',
    workoutTypes: ['cardio', 'running', 'cycling', 'swimming']
  },
];

/**
 * Get hydration recommendations based on workout type and duration
 */
export function getHydrationRecommendations(
  workoutType: WorkoutType,
  durationMinutes: number
): HydrationSupplement[] {
  const recommendations: HydrationSupplement[] = [];
  
  for (const supp of HYDRATION_SUPPLEMENTS) {
    // Check if this supplement applies to the workout type
    if (supp.workoutTypes && !supp.workoutTypes.includes(workoutType)) {
      continue;
    }
    
    // Special rules based on duration
    if (supp.id === 'dextrose' && durationMinutes < 60) {
      continue; // Only for long sessions
    }
    
    if (supp.id === 'sodium-bicarbonate' && durationMinutes < 30) {
      continue; // Only for intense sessions
    }
    
    recommendations.push(supp);
  }
  
  // Always include basic salt for any workout
  if (!recommendations.some(r => r.id === 'salt')) {
    const salt = HYDRATION_SUPPLEMENTS.find(s => s.id === 'salt');
    if (salt) recommendations.unshift(salt);
  }
  
  // Limit to top 4 recommendations
  return recommendations.slice(0, 4);
}

/**
 * Calculate recommended water intake based on workout
 */
export function calculateWaterIntake(
  workoutType: WorkoutType,
  durationMinutes: number,
  bodyWeightKg?: number
): {
  beforeMl: number;
  duringMlPerHour: number;
  afterMl: number;
  totalMl: number;
} {
  // Base rates
  let duringMlPerHour = 500; // Default 500ml per hour
  
  // Adjust based on workout type
  switch (workoutType) {
    case 'hiit':
    case 'running':
      duringMlPerHour = 700;
      break;
    case 'cycling':
    case 'swimming':
      duringMlPerHour = 600;
      break;
    case 'cardio':
      duringMlPerHour = 650;
      break;
    case 'strength':
      duringMlPerHour = 500;
      break;
    case 'yoga':
      duringMlPerHour = 300;
      break;
    default:
      duringMlPerHour = 500;
  }
  
  // Adjust for body weight if provided
  if (bodyWeightKg) {
    const weightFactor = bodyWeightKg / 70; // Normalize to 70kg
    duringMlPerHour = Math.round(duringMlPerHour * weightFactor);
  }
  
  const beforeMl = 250; // 250ml 30min before
  const duringMl = Math.round((durationMinutes / 60) * duringMlPerHour);
  const afterMl = Math.round(duringMl * 1.5); // 150% of what was lost
  
  return {
    beforeMl,
    duringMlPerHour,
    afterMl,
    totalMl: beforeMl + duringMl + afterMl,
  };
}

/**
 * Get hydration tips based on workout phase
 */
export function getHydrationTips(
  workoutType: WorkoutType,
  phase: 'pre' | 'intra' | 'post'
): string[] {
  const tips: string[] = [];
  
  switch (phase) {
    case 'pre':
      tips.push('250ml Wasser 30 Minuten vor dem Training');
      tips.push('Vermeide zu viel Flüssigkeit direkt vor dem Start');
      if (['hiit', 'running', 'cardio'].includes(workoutType)) {
        tips.push('Füge eine Prise Salz hinzu für bessere Absorption');
      }
      break;
      
    case 'intra':
      tips.push('Alle 15-20 Minuten kleine Schlucke trinken');
      if (['hiit', 'running', 'cycling', 'cardio'].includes(workoutType)) {
        tips.push('Elektrolyte hinzufügen bei >45min Training');
      }
      if (['strength'].includes(workoutType)) {
        tips.push('Zwischen den Sätzen trinken, nicht während');
      }
      break;
      
    case 'post':
      tips.push('Für jedes verlorene Kilo: 1.5 Liter Flüssigkeit');
      tips.push('Elektrolyte helfen bei schnellerer Rehydration');
      tips.push('Vermeide Alkohol in den ersten 2 Stunden');
      break;
  }
  
  return tips;
}
