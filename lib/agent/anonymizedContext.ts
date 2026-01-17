/**
 * Anonymisierter Kontext für OpenAI
 * 
 * DSGVO-konform: Keine personenbezogenen Daten werden an OpenAI gesendet.
 * Nur kategorische/aggregierte Werte werden übermittelt.
 */

import { UserContext } from './contextBuilder';

/**
 * Anonymisierter Kontext ohne personenbezogene Daten
 */
export interface AnonymizedContext {
  // Engagement (keine IDs)
  streakCategory: 'none' | 'starting' | 'building' | 'strong' | 'champion';
  levelCategory: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  
  // Stack Info (nur Anzahl und Kategorien)
  stackSize: number;
  stackCategories: string[]; // z.B. ['sleep', 'energy', 'focus']
  
  // Metriken (Trends statt exakter Werte)
  sleepTrend: 'declining' | 'stable' | 'improving';
  energyTrend: 'declining' | 'stable' | 'improving';
  focusTrend: 'declining' | 'stable' | 'improving';
  
  // Kategorische Durchschnitte
  sleepLevel: 'poor' | 'fair' | 'good' | 'excellent';
  energyLevel: 'low' | 'medium' | 'high' | 'very_high';
  focusLevel: 'scattered' | 'moderate' | 'focused' | 'deep_focus';
  
  // Empfehlungen (bereits anonymisiert)
  recommendationTypes: string[];
  warningTypes: string[];
  
  // Zeitkontext
  timeOfDay: 'morning' | 'noon' | 'evening' | 'night';
  isFirstSession: boolean;
  hasCheckedInToday: boolean;
  
  // Allgemeine Patterns (ohne Supplement-Namen)
  hasPositivePatterns: boolean;
  hasNegativePatterns: boolean;
}

/**
 * Konvertiert exakte Werte in kategorische Beschreibungen
 */
function categorizeValue(value: number, type: 'sleep' | 'energy' | 'focus'): string {
  if (type === 'sleep') {
    if (value <= 3) return 'poor';
    if (value <= 5) return 'fair';
    if (value <= 7) return 'good';
    return 'excellent';
  }
  if (type === 'energy') {
    if (value <= 3) return 'low';
    if (value <= 5) return 'medium';
    if (value <= 7) return 'high';
    return 'very_high';
  }
  // focus
  if (value <= 3) return 'scattered';
  if (value <= 5) return 'moderate';
  if (value <= 7) return 'focused';
  return 'deep_focus';
}

/**
 * Berechnet Trend aus den letzten 7 Tagen
 */
function calculateTrend(
  metrics: { date: string; sleep: number; energy: number; focus: number }[],
  key: 'sleep' | 'energy' | 'focus'
): 'declining' | 'stable' | 'improving' {
  if (metrics.length < 3) return 'stable';
  
  // Erste Hälfte vs. zweite Hälfte
  const midpoint = Math.floor(metrics.length / 2);
  const firstHalf = metrics.slice(0, midpoint);
  const secondHalf = metrics.slice(midpoint);
  
  const firstAvg = firstHalf.reduce((sum, m) => sum + (m[key] || 0), 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, m) => sum + (m[key] || 0), 0) / secondHalf.length;
  
  const diff = secondAvg - firstAvg;
  
  if (diff > 0.5) return 'improving';
  if (diff < -0.5) return 'declining';
  return 'stable';
}

/**
 * Kategorisiert Streak-Länge
 */
function categorizeStreak(streak: number): AnonymizedContext['streakCategory'] {
  if (streak === 0) return 'none';
  if (streak <= 3) return 'starting';
  if (streak <= 7) return 'building';
  if (streak <= 30) return 'strong';
  return 'champion';
}

/**
 * Kategorisiert Level
 */
function categorizeLevel(level: number): AnonymizedContext['levelCategory'] {
  if (level <= 3) return 'beginner';
  if (level <= 7) return 'intermediate';
  if (level <= 15) return 'advanced';
  return 'expert';
}

/**
 * Extrahiert Supplement-Kategorien (ohne Namen)
 */
function extractStackCategories(stack: { id: string; name: string }[]): string[] {
  const categories = new Set<string>();
  
  const categoryKeywords: Record<string, string[]> = {
    sleep: ['melatonin', 'magnesium', 'gaba', 'glycin', 'lavender', 'ashwagandha'],
    energy: ['caffeine', 'b12', 'iron', 'coq10', 'rhodiola', 'ginseng'],
    focus: ['lion', 'alpha-gpc', 'l-theanine', 'bacopa', 'modafinil'],
    recovery: ['creatine', 'protein', 'bcaa', 'glutamine', 'collagen'],
    immune: ['vitamin c', 'vitamin d', 'zinc', 'elderberry', 'echinacea'],
    mood: ['5-htp', 'sam-e', 'st. john', 'omega-3'],
  };
  
  for (const item of stack) {
    const nameLower = item.name.toLowerCase();
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(kw => nameLower.includes(kw))) {
        categories.add(category);
      }
    }
  }
  
  return Array.from(categories);
}

/**
 * Ermittelt Tageszeit
 */
function getTimeOfDay(timeStr: string): AnonymizedContext['timeOfDay'] {
  const [hours] = timeStr.split(':').map(Number);
  if (hours >= 5 && hours < 12) return 'morning';
  if (hours >= 12 && hours < 17) return 'noon';
  if (hours >= 17 && hours < 22) return 'evening';
  return 'night';
}

/**
 * Anonymisiert den User-Kontext für OpenAI
 */
export function anonymizeContext(context: UserContext): AnonymizedContext {
  return {
    // Engagement
    streakCategory: categorizeStreak(context.user.streak),
    levelCategory: categorizeLevel(context.user.level),
    
    // Stack
    stackSize: context.stack.length,
    stackCategories: extractStackCategories(context.stack),
    
    // Trends
    sleepTrend: calculateTrend(context.metrics_last_7_days, 'sleep'),
    energyTrend: calculateTrend(context.metrics_last_7_days, 'energy'),
    focusTrend: calculateTrend(context.metrics_last_7_days, 'focus'),
    
    // Levels
    sleepLevel: categorizeValue(context.averages?.sleep || 5, 'sleep') as any,
    energyLevel: categorizeValue(context.averages?.energy || 5, 'energy') as any,
    focusLevel: categorizeValue(context.averages?.focus || 5, 'focus') as any,
    
    // Recommendations (nur Typen)
    recommendationTypes: context.recommendations.map(r => r.type),
    warningTypes: context.warnings.map(w => w.type),
    
    // Zeit
    timeOfDay: getTimeOfDay(context.today.time),
    isFirstSession: context.today.is_first_session,
    hasCheckedInToday: context.checkins_today.length > 0,
    
    // Patterns
    hasPositivePatterns: context.patterns.some(p => p.direction === 'positive'),
    hasNegativePatterns: context.patterns.some(p => p.direction === 'negative'),
  };
}

/**
 * Formatiert anonymisierten Kontext für den Prompt
 */
export function formatAnonymizedContextForPrompt(context: AnonymizedContext): string {
  return `
ANONYMIZED_USER_CONTEXT:
- Engagement: ${context.streakCategory} streak, ${context.levelCategory} level
- Stack: ${context.stackSize} supplements (categories: ${context.stackCategories.join(', ') || 'none'})

WELLNESS_TRENDS:
- Sleep: ${context.sleepLevel} (${context.sleepTrend})
- Energy: ${context.energyLevel} (${context.energyTrend})
- Focus: ${context.focusLevel} (${context.focusTrend})

SESSION_CONTEXT:
- Time: ${context.timeOfDay}
- First session: ${context.isFirstSession ? 'yes' : 'no'}
- Checked in today: ${context.hasCheckedInToday ? 'yes' : 'no'}

INSIGHTS:
- Has positive correlations: ${context.hasPositivePatterns ? 'yes' : 'no'}
- Has concerning patterns: ${context.hasNegativePatterns ? 'yes' : 'no'}
- Active recommendations: ${context.recommendationTypes.length > 0 ? context.recommendationTypes.join(', ') : 'none'}
- Active warnings: ${context.warningTypes.length > 0 ? context.warningTypes.join(', ') : 'none'}
`.trim();
}
