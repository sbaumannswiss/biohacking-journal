/**
 * Timing Optimizer
 * Analysiert und empfiehlt optimale Einnahmezeiten für Supplements
 */

import {
  TimingAnalysis,
  Recommendation,
  UserAnalysisContext,
} from './types';
import {
  analyzeTimingPatterns,
  findOptimalTiming,
  calculateStats,
} from './patternAnalyzer';

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
  
  const timeLabels: Record<string, string> = {
    morning: 'morgens',
    noon: 'mittags',
    evening: 'abends',
    bedtime: 'vor dem Schlafen',
  };
  
  for (const analysis of analyses) {
    const knownOptimal = getKnownOptimalTime(analysis.supplementId, analysis.supplementName);
    
    let message: string;
    if (analysis.confidence > 0.5 && analysis.improvement > 10) {
      // Datenbasierte Empfehlung
      message = `Deine Daten zeigen: ${analysis.supplementName} ${timeLabels[analysis.optimalTime]} zu nehmen könnte deine Werte um ~${analysis.improvement}% verbessern.`;
    } else if (knownOptimal) {
      // Wissenschaftsbasierte Empfehlung
      message = `${analysis.supplementName} wirkt am besten ${timeLabels[knownOptimal.time]}. ${knownOptimal.reason}.`;
    } else {
      message = `Versuch ${analysis.supplementName} ${timeLabels[analysis.optimalTime]} zu nehmen für bessere Ergebnisse.`;
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
  
  return recommendations;
}

