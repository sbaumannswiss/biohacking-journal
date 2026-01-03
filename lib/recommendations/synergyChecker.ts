/**
 * Synergy Checker
 * Identifiziert synergistische und antagonistische Supplement-Kombinationen
 */

import {
  StackSynergy,
  Recommendation,
  UserAnalysisContext,
} from './types';

// Bekannte Synergien und Antagonismen
interface SynergyRule {
  supplements: [string, string];
  type: 'synergistic' | 'antagonistic';
  description: string;
  recommendation: string;
}

const SYNERGY_RULES: SynergyRule[] = [
  // Synergistische Kombinationen
  {
    supplements: ['vitamin-d', 'vitamin-k2'],
    type: 'synergistic',
    description: 'Vitamin K2 leitet Calcium in die Knochen und verhindert Arterienverkalkung',
    recommendation: 'Perfekte Kombination! Zusammen einnehmen für beste Calcium-Verwertung.',
  },
  {
    supplements: ['vitamin-d', 'magnesium'],
    type: 'synergistic',
    description: 'Magnesium ist für die Aktivierung von Vitamin D notwendig',
    recommendation: 'Gute Kombination! Magnesium aktiviert Vitamin D im Körper.',
  },
  {
    supplements: ['caffeine', 'l-theanine'],
    type: 'synergistic',
    description: 'L-Theanin glättet die Koffein-Wirkung und reduziert Nervosität',
    recommendation: 'Smart Stack! L-Theanin + Koffein für ruhigen Fokus ohne Jitter.',
  },
  {
    supplements: ['iron', 'vitamin-c'],
    type: 'synergistic',
    description: 'Vitamin C verbessert die Eisenaufnahme deutlich',
    recommendation: 'Nimm Eisen mit Vitamin C zusammen für 3x bessere Absorption.',
  },
  {
    supplements: ['curcumin', 'black-pepper'],
    type: 'synergistic',
    description: 'Piperin aus schwarzem Pfeffer erhöht Curcumin-Absorption um 2000%',
    recommendation: 'Curcumin immer mit Piperin/schwarzem Pfeffer kombinieren!',
  },
  {
    supplements: ['omega-3', 'vitamin-e'],
    type: 'synergistic',
    description: 'Vitamin E schützt Omega-3-Fettsäuren vor Oxidation',
    recommendation: 'Gute Kombination für antioxidativen Schutz.',
  },
  {
    supplements: ['creatine', 'beta-alanine'],
    type: 'synergistic',
    description: 'Beide verbessern Trainingsleistung auf unterschiedliche Weise',
    recommendation: 'Starke Kombination für Kraft und Ausdauer.',
  },
  {
    supplements: ['ashwagandha', 'rhodiola'],
    type: 'synergistic',
    description: 'Beide Adaptogene mit komplementären Wirkungsprofilen',
    recommendation: 'Synergistische Stress-Reduktion und Energie.',
  },
  
  // Antagonistische Kombinationen
  {
    supplements: ['zinc', 'copper'],
    type: 'antagonistic',
    description: 'Zink und Kupfer konkurrieren um Absorptionswege',
    recommendation: 'Nimm Zink und Kupfer getrennt (mind. 2h Abstand).',
  },
  {
    supplements: ['calcium', 'iron'],
    type: 'antagonistic',
    description: 'Calcium hemmt die Eisenaufnahme',
    recommendation: 'Nicht zusammen nehmen. Mind. 2h Abstand einhalten.',
  },
  {
    supplements: ['calcium', 'magnesium'],
    type: 'antagonistic',
    description: 'Hohe Calcium-Dosen können Magnesium-Absorption reduzieren',
    recommendation: 'Bei hohen Dosen getrennt nehmen (z.B. morgens/abends).',
  },
  {
    supplements: ['zinc', 'iron'],
    type: 'antagonistic',
    description: 'Zink und Eisen konkurrieren um Absorption',
    recommendation: 'Nicht zur gleichen Zeit nehmen. Mind. 2h Abstand.',
  },
  {
    supplements: ['caffeine', 'iron'],
    type: 'antagonistic',
    description: 'Koffein hemmt die Eisenaufnahme',
    recommendation: 'Eisen nicht mit Kaffee oder Tee einnehmen.',
  },
  {
    supplements: ['vitamin-e', 'vitamin-k'],
    type: 'antagonistic',
    description: 'Hohe Vitamin E Dosen können Vitamin K Wirkung beeinträchtigen',
    recommendation: 'Bei hohen Vitamin E Dosen auf Vitamin K achten.',
  },
  {
    supplements: ['st-johns-wort', 'any'],
    type: 'antagonistic',
    description: 'Johanniskraut interagiert mit vielen Substanzen',
    recommendation: 'Vorsicht: Johanniskraut hat viele Wechselwirkungen. Ärztliche Beratung empfohlen.',
  },
];

/**
 * Prüft ob ein Supplement-Name mit einem Regel-Eintrag übereinstimmt
 */
function matchesSupplement(supplementId: string, supplementName: string, ruleKey: string): boolean {
  if (ruleKey === 'any') return true;
  
  const idLower = supplementId.toLowerCase();
  const nameLower = supplementName.toLowerCase();
  const keyLower = ruleKey.toLowerCase();
  
  // Exakter Match
  if (idLower.includes(keyLower)) return true;
  if (nameLower.includes(keyLower)) return true;
  
  // Alias-Matching
  const aliases: Record<string, string[]> = {
    'vitamin-d': ['vitamin d', 'd3', 'cholecalciferol'],
    'vitamin-k2': ['vitamin k', 'k2', 'mk-7', 'mk7', 'menaquinone'],
    'vitamin-c': ['ascorbic', 'ascorbinsäure'],
    'caffeine': ['koffein', 'coffee', 'kaffee'],
    'l-theanine': ['theanin', 'theanine'],
    'omega-3': ['fish oil', 'fischöl', 'epa', 'dha'],
    'magnesium': ['mg', 'magnesiumglycinat', 'magnesiumcitrat'],
    'iron': ['eisen', 'ferrous', 'ferritin'],
    'zinc': ['zink'],
    'copper': ['kupfer'],
    'calcium': ['kalzium', 'ca'],
    'curcumin': ['kurkuma', 'turmeric'],
    'black-pepper': ['pfeffer', 'piperin', 'piperine', 'bioperine'],
    'ashwagandha': ['withania'],
    'rhodiola': ['rosenwurz'],
    'st-johns-wort': ['johanniskraut', 'hypericum'],
  };
  
  const aliasesForKey = aliases[keyLower] || [];
  for (const alias of aliasesForKey) {
    if (idLower.includes(alias) || nameLower.includes(alias)) return true;
  }
  
  return false;
}

/**
 * Findet Synergien und Antagonismen im Stack
 */
export function findStackSynergies(
  context: UserAnalysisContext
): StackSynergy[] {
  const synergies: StackSynergy[] = [];
  const stack = context.currentStack;
  
  // Alle Paare prüfen
  for (let i = 0; i < stack.length; i++) {
    for (let j = i + 1; j < stack.length; j++) {
      const supp1 = stack[i];
      const supp2 = stack[j];
      
      // Prüfe alle Regeln
      for (const rule of SYNERGY_RULES) {
        const [ruleSupp1, ruleSupp2] = rule.supplements;
        
        // Prüfe beide Richtungen
        const match1 = 
          (matchesSupplement(supp1.supplementId, supp1.supplementName, ruleSupp1) &&
           matchesSupplement(supp2.supplementId, supp2.supplementName, ruleSupp2));
        const match2 = 
          (matchesSupplement(supp1.supplementId, supp1.supplementName, ruleSupp2) &&
           matchesSupplement(supp2.supplementId, supp2.supplementName, ruleSupp1));
        
        if (match1 || match2) {
          synergies.push({
            supplements: [supp1.supplementId, supp2.supplementId],
            supplementNames: [supp1.supplementName, supp2.supplementName],
            type: rule.type,
            description: rule.description,
            recommendation: rule.recommendation,
          });
        }
      }
    }
  }
  
  return synergies;
}

/**
 * Generiert Synergie-Empfehlungen
 */
export function generateSynergyRecommendations(
  context: UserAnalysisContext
): Recommendation[] {
  const synergies = findStackSynergies(context);
  const recommendations: Recommendation[] = [];
  
  for (const synergy of synergies) {
    const isAntagonistic = synergy.type === 'antagonistic';
    
    recommendations.push({
      id: `synergy-${synergy.supplements[0]}-${synergy.supplements[1]}`,
      type: 'synergy',
      priority: isAntagonistic ? 'high' : 'low',
      title: isAntagonistic 
        ? `⚠️ Achtung: ${synergy.supplementNames[0]} + ${synergy.supplementNames[1]}`
        : `✨ Synergie: ${synergy.supplementNames[0]} + ${synergy.supplementNames[1]}`,
      message: `${synergy.description}. ${synergy.recommendation}`,
      confidence: 0.9, // Wissenschaftsbasiert
      dataPoints: 0,
      createdAt: new Date(),
    });
  }
  
  return recommendations;
}

/**
 * Prüft auf fehlende synergistische Partner
 */
export function findMissingSynergyPartners(
  context: UserAnalysisContext
): { supplement: string; missingPartner: string; reason: string }[] {
  const missing: { supplement: string; missingPartner: string; reason: string }[] = [];
  const stackIds = new Set(context.currentStack.map(s => s.supplementId.toLowerCase()));
  const stackNames = new Set(context.currentStack.map(s => s.supplementName.toLowerCase()));
  
  // Wichtige Synergie-Partner die fehlen könnten
  const importantPairs: { has: string[]; needs: string; reason: string }[] = [
    { 
      has: ['vitamin-d', 'd3'], 
      needs: 'vitamin-k2', 
      reason: 'Vitamin K2 hilft bei der Calcium-Verwertung und verhindert Arterienverkalkung' 
    },
    { 
      has: ['curcumin', 'kurkuma', 'turmeric'], 
      needs: 'piperin', 
      reason: 'Piperin erhöht die Curcumin-Absorption um bis zu 2000%' 
    },
    { 
      has: ['iron', 'eisen'], 
      needs: 'vitamin-c', 
      reason: 'Vitamin C verbessert die Eisenaufnahme erheblich' 
    },
  ];
  
  for (const pair of importantPairs) {
    // Prüfe ob User einen der "has" Supplements hat
    const hasSupp = pair.has.some(h => 
      [...stackIds].some(id => id.includes(h)) ||
      [...stackNames].some(name => name.includes(h))
    );
    
    if (hasSupp) {
      // Prüfe ob Partner fehlt
      const hasPartner = 
        [...stackIds].some(id => id.includes(pair.needs)) ||
        [...stackNames].some(name => name.includes(pair.needs));
      
      if (!hasPartner) {
        const suppName = context.currentStack.find(s => 
          pair.has.some(h => 
            s.supplementId.toLowerCase().includes(h) || 
            s.supplementName.toLowerCase().includes(h)
          )
        )?.supplementName || pair.has[0];
        
        missing.push({
          supplement: suppName,
          missingPartner: pair.needs,
          reason: pair.reason,
        });
      }
    }
  }
  
  return missing;
}

