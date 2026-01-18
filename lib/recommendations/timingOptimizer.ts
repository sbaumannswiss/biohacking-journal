/**
 * Timing Optimizer
 * Analysiert und empfiehlt optimale Einnahmezeiten für Supplements
 */

import {
  TimingAnalysis,
  Recommendation,
  UserAnalysisContext,
  Chronotype,
} from './types';
import {
  analyzeTimingPatterns,
  findOptimalTiming,
  calculateStats,
} from './patternAnalyzer';

// ============================================
// CHRONOTYPE-BASED TIMING
// Passt Einnahmezeiten basierend auf Chronotyp an
// ============================================

interface ChronotypeTimes {
  morning: string;
  noon: string;
  evening: string;
  bedtime: string;
}

const CHRONOTYPE_TIMES: Record<Chronotype, ChronotypeTimes> = {
  early: {
    morning: '06:00',
    noon: '11:30',
    evening: '18:00',
    bedtime: '21:00',
  },
  normal: {
    morning: '07:30',
    noon: '12:30',
    evening: '19:00',
    bedtime: '22:30',
  },
  late: {
    morning: '09:00',
    noon: '13:30',
    evening: '20:30',
    bedtime: '00:00',
  },
  irregular: {
    morning: '08:00',
    noon: '12:00',
    evening: '19:00',
    bedtime: '23:00',
  },
};

/**
 * Gibt konkrete Uhrzeiten basierend auf Chronotyp zurück
 */
export function getChronotypeTimes(chronotype: Chronotype): ChronotypeTimes {
  return CHRONOTYPE_TIMES[chronotype] || CHRONOTYPE_TIMES.normal;
}

/**
 * Passt eine abstrakte Tageszeit an den Chronotyp an
 */
export function adjustTimeForChronotype(
  baseTime: 'morning' | 'noon' | 'evening' | 'bedtime',
  chronotype: Chronotype
): string {
  const times = getChronotypeTimes(chronotype);
  return times[baseTime];
}

/**
 * Generiert personalisierte Timing-Labels basierend auf Chronotyp
 */
export function getPersonalizedTimeLabel(
  time: 'morning' | 'noon' | 'evening' | 'bedtime',
  chronotype?: Chronotype
): string {
  const baseLabels: Record<string, string> = {
    morning: 'morgens',
    noon: 'mittags',
    evening: 'abends',
    bedtime: 'vor dem Schlafen',
  };
  
  if (!chronotype) {
    return baseLabels[time];
  }
  
  const concreteTime = adjustTimeForChronotype(time, chronotype);
  return `${baseLabels[time]} (~${concreteTime})`;
}

/**
 * Prüft ob Koffein zu spät für den Chronotyp genommen wird
 */
export function isCaffeineTooLate(
  supplementTime: 'morning' | 'noon' | 'evening' | 'bedtime',
  chronotype: Chronotype
): boolean {
  const times = getChronotypeTimes(chronotype);
  const bedtimeHour = parseInt(times.bedtime.split(':')[0]);
  
  // Koffein sollte min. 8 Stunden vor Schlafenszeit sein
  const cutoffHour = (bedtimeHour - 8 + 24) % 24;
  
  const timeHours: Record<string, number> = {
    morning: parseInt(times.morning.split(':')[0]),
    noon: parseInt(times.noon.split(':')[0]),
    evening: parseInt(times.evening.split(':')[0]),
    bedtime: bedtimeHour,
  };
  
  const suppHour = timeHours[supplementTime];
  
  // Zu spät wenn nach cutoff
  if (cutoffHour > 12) {
    return suppHour >= cutoffHour || suppHour < 6;
  } else {
    return suppHour >= cutoffHour && suppHour < bedtimeHour;
  }
}

// Bekannte optimale Zeiten für Supplements (wissenschaftlich basiert)
const KNOWN_OPTIMAL_TIMES: Record<string, {
  time: 'morning' | 'noon' | 'evening' | 'bedtime';
  reason: string;
}> = {
  'creatine': { time: 'morning', reason: 'Bessere Aufnahme vor Training' },
  'magnesium': { time: 'bedtime', reason: 'Unterstützt Schlafqualität' },
  'vitamin-d': { time: 'morning', reason: 'Fettlöslich, besser mit Frühstück' },
  'omega-3': { time: 'noon', reason: 'Mit fettiger Mahlzeit für beste Absorption' },
  'caffeine': { time: 'morning', reason: 'Nicht nach 14 Uhr für guten Schlaf' },
  'l-theanine': { time: 'morning', reason: 'Synergistisch mit Koffein' },
  'ashwagandha': { time: 'bedtime', reason: 'Unterstützt Cortisol-Regulation nachts' },
  'melatonin': { time: 'bedtime', reason: '30-60 Min vor dem Schlafen' },
  'zinc': { time: 'bedtime', reason: 'Unterstützt Regeneration im Schlaf' },
  'b-complex': { time: 'morning', reason: 'Kann Energie liefern, nicht abends' },
  'iron': { time: 'morning', reason: 'Nüchtern für beste Absorption' },
  'probiotics': { time: 'morning', reason: 'Vor dem Frühstück auf leeren Magen' },
};

/**
 * Findet bekannte optimale Zeit für ein Supplement
 */
function getKnownOptimalTime(supplementId: string, supplementName: string): {
  time: 'morning' | 'noon' | 'evening' | 'bedtime';
  reason: string;
} | null {
  // Suche nach ID
  const idLower = supplementId.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_OPTIMAL_TIMES)) {
    if (idLower.includes(key)) return value;
  }
  
  // Suche nach Name
  const nameLower = supplementName.toLowerCase();
  for (const [key, value] of Object.entries(KNOWN_OPTIMAL_TIMES)) {
    if (nameLower.includes(key)) return value;
  }
  
  return null;
}

/**
 * Analysiert Timing für alle Supplements im Stack
 */
export function analyzeTimingForStack(
  context: UserAnalysisContext
): TimingAnalysis[] {
  const analyses: TimingAnalysis[] = [];
  const timingData = analyzeTimingPatterns(context);
  
  for (const stackItem of context.currentStack) {
    const supplementTimings = timingData.get(stackItem.supplementId);
    const knownOptimal = getKnownOptimalTime(stackItem.supplementId, stackItem.supplementName);
    
    // Datenbasierte Analyse
    if (supplementTimings && supplementTimings.size > 0) {
      const optimal = findOptimalTiming(supplementTimings);
      
      if (optimal && optimal.confidence > 0.3) {
        // Vergleiche mit aktuellem Timing
        const currentTime = stackItem.time as 'morning' | 'noon' | 'evening' | 'bedtime' | undefined;
        
        if (currentTime && currentTime !== optimal.time) {
          // Berechne Verbesserungspotenzial
          const currentScores = supplementTimings.get(currentTime);
          const optimalScores = supplementTimings.get(optimal.time);
          
          if (currentScores && optimalScores && currentScores.length > 0 && optimalScores.length > 0) {
            const currentStats = calculateStats(currentScores);
            const optimalStats = calculateStats(optimalScores);
            const improvement = ((optimalStats.mean - currentStats.mean) / currentStats.mean) * 100;
            
            if (improvement > 5) { // Nur empfehlen wenn > 5% Verbesserung
              analyses.push({
                supplementId: stackItem.supplementId,
                supplementName: stackItem.supplementName,
                optimalTime: optimal.time as 'morning' | 'noon' | 'evening' | 'bedtime',
                currentTime,
                improvement: Math.round(improvement),
                metric: 'energy', // Gesamt-Score
                confidence: optimal.confidence,
              });
            }
          }
        }
      }
    }
    
    // Fallback auf bekannte optimale Zeiten
    if (!analyses.find(a => a.supplementId === stackItem.supplementId) && knownOptimal) {
      const currentTime = stackItem.time as 'morning' | 'noon' | 'evening' | 'bedtime' | undefined;
      
      if (currentTime && currentTime !== knownOptimal.time) {
        analyses.push({
          supplementId: stackItem.supplementId,
          supplementName: stackItem.supplementName,
          optimalTime: knownOptimal.time,
          currentTime,
          improvement: 10, // Geschätzte Verbesserung
          metric: 'energy',
          confidence: 0.7, // Basiert auf Wissenschaft
        });
      }
    }
  }
  
  return analyses;
}

/**
 * Generiert Timing-Empfehlungen
 */
export function generateTimingRecommendations(
  context: UserAnalysisContext
): Recommendation[] {
  const analyses = analyzeTimingForStack(context);
  const recommendations: Recommendation[] = [];
  const chronotype = context.profile?.chronotype as Chronotype | undefined;
  
  for (const analysis of analyses) {
    const knownOptimal = getKnownOptimalTime(analysis.supplementId, analysis.supplementName);
    const timeLabel = getPersonalizedTimeLabel(analysis.optimalTime, chronotype);
    
    let message: string;
    if (analysis.confidence > 0.5 && analysis.improvement > 10) {
      // Datenbasierte Empfehlung
      message = `Deine Daten zeigen: ${analysis.supplementName} ${timeLabel} zu nehmen könnte deine Werte um ~${analysis.improvement}% verbessern.`;
    } else if (knownOptimal) {
      // Wissenschaftsbasierte Empfehlung mit Chronotyp-Anpassung
      const optimalLabel = getPersonalizedTimeLabel(knownOptimal.time, chronotype);
      message = `${analysis.supplementName} wirkt am besten ${optimalLabel}. ${knownOptimal.reason}.`;
    } else {
      message = `Versuch ${analysis.supplementName} ${timeLabel} zu nehmen für bessere Ergebnisse.`;
    }
    
    recommendations.push({
      id: `timing-${analysis.supplementId}`,
      type: 'timing',
      priority: analysis.improvement > 15 ? 'high' : 'medium',
      title: `⏰ Timing für ${analysis.supplementName}`,
      message,
      supplement: analysis.supplementName,
      confidence: analysis.confidence,
      dataPoints: 0, // Wird später befüllt
      createdAt: new Date(),
    });
  }
  
  // Chronotyp-spezifische Koffein-Warnung
  if (chronotype) {
    for (const stackItem of context.currentStack) {
      const isCaffeine = stackItem.supplementId.toLowerCase().includes('caffeine') ||
                         stackItem.supplementName.toLowerCase().includes('koffein');
      const currentTime = stackItem.time as 'morning' | 'noon' | 'evening' | 'bedtime' | undefined;
      
      if (isCaffeine && currentTime && isCaffeineTooLate(currentTime, chronotype)) {
        const bedtime = getChronotypeTimes(chronotype).bedtime;
        recommendations.push({
          id: `timing-caffeine-chronotype`,
          type: 'timing',
          priority: 'high',
          title: `⚠️ Koffein-Timing`,
          message: `Als ${chronotype === 'early' ? 'Frühaufsteher' : chronotype === 'late' ? 'Nachtmensch' : 'Person mit deinem Chronotyp'} solltest du Koffein nicht nach 14 Uhr nehmen (Schlafenszeit ~${bedtime}).`,
          supplement: stackItem.supplementName,
          confidence: 0.9,
          dataPoints: 0,
          createdAt: new Date(),
        });
      }
    }
  }
  
  return recommendations;
}

