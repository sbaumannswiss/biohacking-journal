/**
 * Interaction Warner
 * Warnt vor potenziellen Problemen und Interaktionen
 */

import {
  SupplementWarning,
  Recommendation,
  UserAnalysisContext,
} from './types';

// ============================================
// MEDICATION INTERACTIONS
// Wissenschaftlich belegte Interaktionen zwischen
// Medikamenten und Supplements
// ============================================

interface MedicationInteraction {
  contraindicated: string[];  // Absolute Kontraindikation
  warning: string[];          // Vorsicht geboten
  info: string[];             // Info zur Absorption etc.
}

const MEDICATION_INTERACTIONS: Record<string, MedicationInteraction> = {
  'blood-thinners': {
    contraindicated: ['omega-3', 'fish-oil', 'fischöl', 'vitamin-e', 'ginkgo', 'garlic', 'knoblauch', 'ginger', 'ingwer'],
    warning: ['curcumin', 'turmeric', 'kurkuma', 'nattokinase', 'bromelain'],
    info: ['vitamin-k'],  // Interagiert mit Warfarin-Dosierung
  },
  'antidepressants': {
    contraindicated: ['st-johns-wort', 'johanniskraut', '5-htp', 'sam-e', 'l-tryptophan'],
    warning: ['rhodiola', 'l-tyrosine', 'tyrosin', 'ginseng'],
    info: ['omega-3'],  // Kann synergistisch wirken
  },
  'blood-pressure': {
    contraindicated: ['licorice', 'süßholz', 'ephedra', 'ma-huang'],
    warning: ['caffeine', 'koffein', 'ginseng', 'yohimbine'],
    info: ['coq10', 'magnesium'],  // Kann blutdrucksenkend wirken
  },
  'thyroid': {
    contraindicated: [],
    warning: ['soy', 'soja', 'kelp', 'iodine', 'jod'],
    info: ['calcium', 'iron', 'eisen'],  // Mind. 4h Abstand
  },
  'diabetes': {
    contraindicated: [],
    warning: ['chromium', 'chrom', 'alpha-lipoic', 'berberine', 'cinnamon', 'zimt', 'bitter-melon'],
    info: ['magnesium', 'vitamin-d'],  // Kann Insulin-Sensitivität beeinflussen
  },
  'birth-control': {
    contraindicated: ['st-johns-wort', 'johanniskraut'],
    warning: ['activated-charcoal', 'aktivkohle'],
    info: ['probiotics', 'probiotika'],  // Bei Durchfall
  },
};

/**
 * Prüft Medikamenten-Interaktionen basierend auf User-Profil
 */
export function checkMedicationInteractions(
  context: UserAnalysisContext
): SupplementWarning[] {
  const warnings: SupplementWarning[] = [];
  const medications = context.profile?.medications || [];
  
  if (medications.length === 0 || medications.includes('none')) {
    return warnings;
  }
  
  for (const medication of medications) {
    const interactions = MEDICATION_INTERACTIONS[medication];
    if (!interactions) continue;
    
    for (const stackItem of context.currentStack) {
      const idLower = stackItem.supplementId.toLowerCase();
      const nameLower = stackItem.supplementName.toLowerCase();
      
      // Contraindicated - kritisch
      for (const contra of interactions.contraindicated) {
        if (idLower.includes(contra) || nameLower.includes(contra)) {
          warnings.push({
            supplementId: stackItem.supplementId,
            supplementName: stackItem.supplementName,
            type: 'medication',
            severity: 'critical',
            message: `${stackItem.supplementName} ist KONTRAINDIZIERT mit ${getMedicationLabel(medication)}. Ärztliche Beratung erforderlich!`,
            affectedSupplements: [stackItem.supplementName],
          });
        }
      }
      
      // Warning - Vorsicht
      for (const warn of interactions.warning) {
        if (idLower.includes(warn) || nameLower.includes(warn)) {
          warnings.push({
            supplementId: stackItem.supplementId,
            supplementName: stackItem.supplementName,
            type: 'medication',
            severity: 'warning',
            message: `${stackItem.supplementName} kann mit ${getMedicationLabel(medication)} interagieren. Mit Arzt absprechen.`,
            affectedSupplements: [stackItem.supplementName],
          });
        }
      }
      
      // Info - Hinweise
      for (const info of interactions.info) {
        if (idLower.includes(info) || nameLower.includes(info)) {
          warnings.push({
            supplementId: stackItem.supplementId,
            supplementName: stackItem.supplementName,
            type: 'medication',
            severity: 'info',
            message: `${stackItem.supplementName} kann die Wirkung von ${getMedicationLabel(medication)} beeinflussen. Monitoring empfohlen.`,
            affectedSupplements: [stackItem.supplementName],
          });
        }
      }
    }
  }
  
  return warnings;
}

/**
 * Lesbare Labels für Medikamenten-Kategorien
 */
function getMedicationLabel(medicationId: string): string {
  const labels: Record<string, string> = {
    'blood-thinners': 'Blutverdünnern',
    'antidepressants': 'Antidepressiva',
    'blood-pressure': 'Blutdruckmedikamenten',
    'thyroid': 'Schilddrüsenmedikamenten',
    'diabetes': 'Diabetes-Medikamenten',
    'birth-control': 'Verhütungsmitteln',
  };
  return labels[medicationId] || medicationId;
}

// ============================================
// SUPPLEMENT WARNINGS
// ============================================

// Bekannte Warnungen und Kontraindikationen
interface WarningRule {
  trigger: string[];
  type: 'interaction' | 'timing' | 'dosage' | 'contraindication';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  condition?: (context: UserAnalysisContext) => boolean;
}

const WARNING_RULES: WarningRule[] = [
  // Koffein-bezogene Warnungen
  {
    trigger: ['caffeine', 'koffein', 'coffee'],
    type: 'timing',
    severity: 'warning',
    message: 'Koffein nach 14 Uhr kann den Schlaf beeinträchtigen. Halbwertszeit: ~6 Stunden.',
    condition: (ctx) => {
      const caffeineItems = ctx.currentStack.filter(s => 
        s.supplementId.toLowerCase().includes('caffeine') ||
        s.supplementName.toLowerCase().includes('koffein')
      );
      return caffeineItems.some(s => s.time === 'evening' || s.time === 'bedtime');
    },
  },
  
  // Eisenabsorption
  {
    trigger: ['iron', 'eisen'],
    type: 'interaction',
    severity: 'info',
    message: 'Eisen nicht mit Kaffee, Tee oder Calcium einnehmen. Vitamin C verbessert die Aufnahme.',
  },
  
  // Vitamin D Dosierung
  {
    trigger: ['vitamin-d', 'd3', 'cholecalciferol'],
    type: 'dosage',
    severity: 'info',
    message: 'Vitamin D ist fettlöslich. Am besten mit einer Mahlzeit mit Fett einnehmen.',
  },
  
  // Magnesium Formen
  {
    trigger: ['magnesium-oxide', 'magnesiumoxid'],
    type: 'dosage',
    severity: 'warning',
    message: 'Magnesiumoxid hat geringe Bioverfügbarkeit. Glycinat oder Citrat sind besser absorbierbar.',
  },
  
  // Zink auf leeren Magen
  {
    trigger: ['zinc', 'zink'],
    type: 'dosage',
    severity: 'info',
    message: 'Zink auf leeren Magen kann Übelkeit verursachen. Besser mit einer Mahlzeit nehmen.',
  },
  
  // Melatonin Dosierung
  {
    trigger: ['melatonin'],
    type: 'dosage',
    severity: 'warning',
    message: 'Niedrige Melatonin-Dosen (0.3-0.5mg) sind oft effektiver als hohe Dosen.',
  },
  
  // Johanniskraut Interaktionen
  {
    trigger: ['st-johns-wort', 'johanniskraut', 'hypericum'],
    type: 'contraindication',
    severity: 'critical',
    message: 'Johanniskraut interagiert mit vielen Medikamenten (Antibabypille, Antidepressiva, etc.). Ärztliche Beratung empfohlen!',
  },
  
  // Fischöl Qualität
  {
    trigger: ['omega-3', 'fish-oil', 'fischöl', 'epa', 'dha'],
    type: 'dosage',
    severity: 'info',
    message: 'Fischöl im Kühlschrank lagern. Ranziges Öl erkennst du am fischigen Geruch.',
  },
  
  // Adaptogene Cycling
  {
    trigger: ['ashwagandha', 'rhodiola', 'adaptogen'],
    type: 'dosage',
    severity: 'info',
    message: 'Adaptogene können bei Dauereinnahme an Wirkung verlieren. Cycling (z.B. 6 Wochen on, 2 Wochen off) empfohlen.',
  },
  
  // Probiotika Timing
  {
    trigger: ['probiotic', 'probiotika', 'lactobacillus', 'bifidobacterium'],
    type: 'timing',
    severity: 'info',
    message: 'Probiotika am besten auf leeren Magen oder vor den Mahlzeiten für beste Überlebensrate.',
  },
  
  // B-Vitamine abends
  {
    trigger: ['b-complex', 'b-komplex', 'vitamin-b12', 'b12'],
    type: 'timing',
    severity: 'warning',
    message: 'B-Vitamine können energetisierend wirken. Nicht vor dem Schlafen nehmen.',
    condition: (ctx) => {
      const bItems = ctx.currentStack.filter(s => 
        s.supplementId.toLowerCase().includes('b-complex') ||
        s.supplementId.toLowerCase().includes('b12') ||
        s.supplementName.toLowerCase().includes('b-komplex')
      );
      return bItems.some(s => s.time === 'bedtime');
    },
  },
  
  // Kreatin Hydrierung
  {
    trigger: ['creatine', 'kreatin'],
    type: 'dosage',
    severity: 'info',
    message: 'Kreatin erhöht den Wasserbedarf. Trinke zusätzlich 0.5-1L Wasser täglich.',
  },
  
  // Überdosierungs-Warnung für fettlösliche Vitamine
  {
    trigger: ['vitamin-a', 'retinol'],
    type: 'dosage',
    severity: 'warning',
    message: 'Vitamin A ist fettlöslich und kann sich anreichern. Nicht über 3000 µg täglich ohne ärztliche Beratung.',
  },
];

/**
 * Prüft ob ein Supplement eine Warnung triggert
 */
function matchesWarningTrigger(
  supplementId: string, 
  supplementName: string, 
  triggers: string[]
): boolean {
  const idLower = supplementId.toLowerCase();
  const nameLower = supplementName.toLowerCase();
  
  return triggers.some(trigger => 
    idLower.includes(trigger) || nameLower.includes(trigger)
  );
}

/**
 * Findet alle relevanten Warnungen für den Stack
 */
export function findStackWarnings(
  context: UserAnalysisContext
): SupplementWarning[] {
  const warnings: SupplementWarning[] = [];
  const seenWarnings = new Set<string>();
  
  // 1. Standard-Supplement-Warnungen
  for (const stackItem of context.currentStack) {
    for (const rule of WARNING_RULES) {
      if (matchesWarningTrigger(stackItem.supplementId, stackItem.supplementName, rule.trigger)) {
        // Prüfe Condition wenn vorhanden
        if (rule.condition && !rule.condition(context)) {
          continue;
        }
        
        const warningKey = `${stackItem.supplementId}-${rule.type}-${rule.message.slice(0, 20)}`;
        if (seenWarnings.has(warningKey)) continue;
        seenWarnings.add(warningKey);
        
        warnings.push({
          supplementId: stackItem.supplementId,
          supplementName: stackItem.supplementName,
          type: rule.type,
          severity: rule.severity,
          message: rule.message,
        });
      }
    }
  }
  
  // 2. Medikamenten-Interaktionen (wenn Profil vorhanden)
  if (context.profile?.medications && context.profile.medications.length > 0) {
    const medicationWarnings = checkMedicationInteractions(context);
    for (const medWarn of medicationWarnings) {
      const warningKey = `med-${medWarn.supplementId}-${medWarn.message.slice(0, 20)}`;
      if (!seenWarnings.has(warningKey)) {
        seenWarnings.add(warningKey);
        warnings.push(medWarn);
      }
    }
  }
  
  // 3. Koffein-Warnung basierend auf Profil
  if (context.profile?.caffeineLevel === 'high') {
    const caffeineSupps = context.currentStack.filter(s => 
      s.supplementId.toLowerCase().includes('caffeine') ||
      s.supplementName.toLowerCase().includes('koffein')
    );
    if (caffeineSupps.length > 0) {
      const warningKey = 'caffeine-high-intake';
      if (!seenWarnings.has(warningKey)) {
        seenWarnings.add(warningKey);
        warnings.push({
          supplementId: 'caffeine',
          supplementName: 'Koffein',
          type: 'dosage',
          severity: 'warning',
          message: 'Du konsumierst bereits viel Koffein (300mg+). Supplements mit Koffein können zu Überdosierung führen.',
        });
      }
    }
  }
  
  return warnings;
}

/**
 * Prüft auf Stack-spezifische Warnungen
 */
export function checkStackSpecificWarnings(
  context: UserAnalysisContext
): SupplementWarning[] {
  const warnings: SupplementWarning[] = [];
  
  // Prüfe auf zu viele Supplements
  if (context.currentStack.length > 15) {
    warnings.push({
      supplementId: 'stack',
      supplementName: 'Gesamter Stack',
      type: 'dosage',
      severity: 'warning',
      message: `Du hast ${context.currentStack.length} Supplements im Stack. Das kann die Absorption beeinträchtigen und ist schwer zu tracken. Fokussiere dich auf die wichtigsten.`,
    });
  }
  
  // Prüfe auf Dopamin-Stack
  const dopamineSupps = ['caffeine', 'koffein', 'l-tyrosine', 'tyrosin', 'mucuna', 'l-dopa'];
  const dopamineCount = context.currentStack.filter(s => 
    dopamineSupps.some(d => 
      s.supplementId.toLowerCase().includes(d) || 
      s.supplementName.toLowerCase().includes(d)
    )
  ).length;
  
  if (dopamineCount >= 3) {
    warnings.push({
      supplementId: 'stack',
      supplementName: 'Dopamin-Stack',
      type: 'interaction',
      severity: 'warning',
      message: 'Mehrere dopaminerge Supplements können zu Toleranz und Downregulation führen. Periodisierung empfohlen.',
    });
  }
  
  // Prüfe auf Serotonin-Stack
  const serotoninSupps = ['5-htp', 'tryptophan', 'st-johns-wort', 'johanniskraut'];
  const serotoninCount = context.currentStack.filter(s => 
    serotoninSupps.some(d => 
      s.supplementId.toLowerCase().includes(d) || 
      s.supplementName.toLowerCase().includes(d)
    )
  ).length;
  
  if (serotoninCount >= 2) {
    warnings.push({
      supplementId: 'stack',
      supplementName: 'Serotonin-Stack',
      type: 'contraindication',
      severity: 'critical',
      message: 'Kombination mehrerer serotonerger Substanzen kann gefährlich sein (Serotonin-Syndrom). Nicht ohne ärztliche Beratung!',
    });
  }
  
  return warnings;
}

/**
 * Generiert Warnungs-Empfehlungen
 */
export function generateWarningRecommendations(
  context: UserAnalysisContext
): Recommendation[] {
  const itemWarnings = findStackWarnings(context);
  const stackWarnings = checkStackSpecificWarnings(context);
  const allWarnings = [...itemWarnings, ...stackWarnings];
  
  const recommendations: Recommendation[] = [];
  
  const severityEmojis: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    critical: '🚨',
  };
  
  const severityPriority: Record<string, 'low' | 'medium' | 'high' | 'critical'> = {
    info: 'low',
    warning: 'medium',
    critical: 'critical',
  };
  
  for (const warning of allWarnings) {
    recommendations.push({
      id: `warning-${warning.supplementId}-${warning.type}`,
      type: 'warning',
      priority: severityPriority[warning.severity],
      title: `${severityEmojis[warning.severity]} ${warning.supplementName}`,
      message: warning.message,
      supplement: warning.supplementName,
      confidence: 0.95, // Wissenschaftsbasiert
      dataPoints: 0,
      createdAt: new Date(),
    });
  }
  
  // Sortiere nach Priorität (critical zuerst)
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return recommendations.sort((a, b) => 
    priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

/**
 * Prüft ein neues Supplement auf Warnungen bevor es hinzugefügt wird
 */
export function checkNewSupplementWarnings(
  supplementId: string,
  supplementName: string,
  currentStack: { supplementId: string; supplementName: string }[]
): SupplementWarning[] {
  const warnings: SupplementWarning[] = [];
  
  // Prüfe auf direkte Warnungen
  for (const rule of WARNING_RULES) {
    if (matchesWarningTrigger(supplementId, supplementName, rule.trigger)) {
      // Überspringe Condition-basierte Warnungen für neue Supplements
      if (rule.condition) continue;
      
      warnings.push({
        supplementId,
        supplementName,
        type: rule.type,
        severity: rule.severity,
        message: rule.message,
      });
    }
  }
  
  // Prüfe auf Interaktionen mit bestehendem Stack
  const antagonisticPairs: [string[], string[], string][] = [
    [['zinc', 'zink'], ['iron', 'eisen'], 'Zink und Eisen konkurrieren um Absorption. Getrennt einnehmen.'],
    [['calcium', 'kalzium'], ['iron', 'eisen'], 'Calcium hemmt Eisenaufnahme. Getrennt einnehmen.'],
    [['zinc', 'zink'], ['copper', 'kupfer'], 'Zink und Kupfer konkurrieren um Absorption.'],
  ];
  
  for (const [supp1Triggers, supp2Triggers, message] of antagonisticPairs) {
    const newMatchesFirst = supp1Triggers.some(t => 
      supplementId.toLowerCase().includes(t) || supplementName.toLowerCase().includes(t)
    );
    const newMatchesSecond = supp2Triggers.some(t => 
      supplementId.toLowerCase().includes(t) || supplementName.toLowerCase().includes(t)
    );
    
    for (const stackItem of currentStack) {
      const stackMatchesFirst = supp1Triggers.some(t => 
        stackItem.supplementId.toLowerCase().includes(t) || 
        stackItem.supplementName.toLowerCase().includes(t)
      );
      const stackMatchesSecond = supp2Triggers.some(t => 
        stackItem.supplementId.toLowerCase().includes(t) || 
        stackItem.supplementName.toLowerCase().includes(t)
      );
      
      if ((newMatchesFirst && stackMatchesSecond) || (newMatchesSecond && stackMatchesFirst)) {
        warnings.push({
          supplementId,
          supplementName,
          type: 'interaction',
          severity: 'warning',
          message,
          affectedSupplements: [stackItem.supplementName],
        });
      }
    }
  }
  
  return warnings;
}

