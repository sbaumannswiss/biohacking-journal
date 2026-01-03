/**
 * Recommendation Service
 * Zentraler Service für alle Empfehlungen
 */

import {
  Recommendation,
  UserAnalysisContext,
  AnalysisResult,
  AnalysisPeriod,
  JournalEntry,
  CheckInData,
} from './types';
import { analyzeSupplementMetricCorrelations } from './patternAnalyzer';
import { analyzeTimingForStack, generateTimingRecommendations } from './timingOptimizer';
import { analyzeDosagesForStack, generateDosageRecommendations } from './dosageAdvisor';
import { findStackSynergies, generateSynergyRecommendations, findMissingSynergyPartners } from './synergyChecker';
import { analyzeAllLifestylePatterns, generateLifestyleRecommendations } from './lifestyleCoach';
import { findStackWarnings, checkStackSpecificWarnings, generateWarningRecommendations } from './interactionWarner';

/**
 * Zentraler Recommendation Service
 */
export class RecommendationService {
  private context: UserAnalysisContext;
  
  constructor(context: UserAnalysisContext) {
    this.context = context;
  }
  
  /**
   * Generiert alle Empfehlungen
   */
  generateAllRecommendations(): Recommendation[] {
    const allRecs: Recommendation[] = [];
    
    // Warnungen (höchste Priorität)
    allRecs.push(...generateWarningRecommendations(this.context));
    
    // Synergien
    allRecs.push(...generateSynergyRecommendations(this.context));
    
    // Timing
    allRecs.push(...generateTimingRecommendations(this.context));
    
    // Dosierung
    allRecs.push(...generateDosageRecommendations(this.context));
    
    // Lifestyle
    allRecs.push(...generateLifestyleRecommendations(this.context));
    
    // Sortiere nach Priorität
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return allRecs.sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }
  
  /**
   * Generiert Top-Empfehlungen (limitiert)
   */
  getTopRecommendations(limit: number = 5): Recommendation[] {
    const all = this.generateAllRecommendations();
    return all.slice(0, limit);
  }
  
  /**
   * Generiert Empfehlungen nach Typ
   */
  getRecommendationsByType(type: Recommendation['type']): Recommendation[] {
    return this.generateAllRecommendations().filter(r => r.type === type);
  }
  
  /**
   * Führt vollständige Analyse durch
   */
  performFullAnalysis(): AnalysisResult {
    return {
      userId: this.context.userId,
      analyzedAt: new Date(),
      period: 'month',
      recommendations: this.generateAllRecommendations(),
      correlations: analyzeSupplementMetricCorrelations(this.context),
      timingAnalysis: analyzeTimingForStack(this.context),
      dosageAnalysis: analyzeDosagesForStack(this.context),
      synergies: findStackSynergies(this.context),
      lifestylePatterns: analyzeAllLifestylePatterns(this.context),
      warnings: [
        ...findStackWarnings(this.context),
        ...checkStackSpecificWarnings(this.context),
      ],
    };
  }
  
  /**
   * Findet fehlende Synergie-Partner
   */
  getMissingSynergyPartners() {
    return findMissingSynergyPartners(this.context);
  }
  
  /**
   * Prüft ob genug Daten für Analyse vorhanden sind
   */
  hasEnoughData(): { 
    ready: boolean; 
    journalDays: number; 
    checkIns: number; 
    recommendation: string;
  } {
    const journalDays = this.context.journalHistory.length;
    const checkIns = this.context.checkInHistory.length;
    
    if (journalDays < 7) {
      return {
        ready: false,
        journalDays,
        checkIns,
        recommendation: `Noch ${7 - journalDays} Tage Journal-Einträge für erste Insights.`,
      };
    }
    
    if (checkIns < 14) {
      return {
        ready: false,
        journalDays,
        checkIns,
        recommendation: `Noch ${14 - checkIns} Check-Ins für personalisierte Empfehlungen.`,
      };
    }
    
    return {
      ready: true,
      journalDays,
      checkIns,
      recommendation: 'Genug Daten für personalisierte Analyse!',
    };
  }
  
  /**
   * Generiert eine Zusammenfassung für den Chat
   */
  generateChatSummary(): string {
    const analysis = this.hasEnoughData();
    
    if (!analysis.ready) {
      return analysis.recommendation;
    }
    
    const recs = this.getTopRecommendations(3);
    
    if (recs.length === 0) {
      return 'Alles sieht gut aus! Dein Stack ist solide. Weiter so!';
    }
    
    const critical = recs.filter(r => r.priority === 'critical' || r.priority === 'high');
    
    if (critical.length > 0) {
      return `Wichtig: ${critical[0].message}`;
    }
    
    return `Insight: ${recs[0].message}`;
  }
}

/**
 * Factory-Funktion für einfache Erstellung
 */
export function createRecommendationService(
  userId: string,
  journalHistory: JournalEntry[],
  checkInHistory: CheckInData[],
  currentStack: { supplementId: string; supplementName: string; dosage?: string; time?: string }[]
): RecommendationService {
  const context: UserAnalysisContext = {
    userId,
    journalHistory,
    checkInHistory,
    currentStack,
  };
  
  return new RecommendationService(context);
}

/**
 * Schnelle Funktion für einzelne Empfehlung (für Helix-Messages)
 */
export function getQuickRecommendation(
  context: UserAnalysisContext
): Recommendation | null {
  const service = new RecommendationService(context);
  const recs = service.getTopRecommendations(1);
  return recs.length > 0 ? recs[0] : null;
}

