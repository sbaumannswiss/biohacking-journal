/**
 * Recommendation System - Main Entry Point
 * Exportiert alle Empfehlungs-Module
 */

// Types
export * from './types';

// Pattern Analyzer
export {
  analyzeSupplementMetricCorrelations,
  analyzeTimingPatterns,
  analyzeLifestylePatterns,
  calculateStats,
  findOptimalTiming,
} from './patternAnalyzer';

// Timing Optimizer
export {
  analyzeTimingForStack,
  generateTimingRecommendations,
  getChronotypeTimes,
  adjustTimeForChronotype,
  getPersonalizedTimeLabel,
  isCaffeineTooLate,
} from './timingOptimizer';

// Dosage Advisor
export {
  analyzeDosageForSupplement,
  analyzeDosagesForStack,
  generateDosageRecommendations,
} from './dosageAdvisor';

// Synergy Checker
export {
  findStackSynergies,
  generateSynergyRecommendations,
  findMissingSynergyPartners,
} from './synergyChecker';

// Lifestyle Coach
export {
  analyzeAllLifestylePatterns,
  generateLifestyleRecommendations,
  generatePersonalizedTips,
} from './lifestyleCoach';

// Interaction Warner
export {
  findStackWarnings,
  checkStackSpecificWarnings,
  generateWarningRecommendations,
  checkNewSupplementWarnings,
  checkMedicationInteractions,
} from './interactionWarner';

// Re-export the main service
export { 
  RecommendationService, 
  createRecommendationService,
  getQuickRecommendation 
} from './recommendationService';

