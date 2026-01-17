/**
 * XP System - Neues faires Punktesystem
 * 
 * XP-Quellen (pro Tag):
 * - Journal geloggt: 50 XP
 * - Stack 100% erledigt: 25 XP
 * - 7-Tage Streak Bonus: +50 XP
 * - 30-Tage Streak Bonus: +100 XP
 * 
 * Level-Kurve: Steigende Anforderungen
 */

// XP-Werte für verschiedene Aktionen
export const XP_VALUES = {
  JOURNAL_LOGGED: 50,      // Tägliches Journal
  STACK_COMPLETE: 25,      // Alle Supplements genommen
  STREAK_7_DAYS: 50,       // Wöchentlicher Streak-Bonus
  STREAK_30_DAYS: 100,     // Monatlicher Streak-Bonus
  FIRST_JOURNAL: 100,      // Erster Journal-Eintrag (einmalig)
  FIRST_SUPPLEMENT: 50,    // Erstes Supplement hinzugefügt (einmalig)
} as const;

// Maximum XP pro Tag (ohne Streak-Bonus)
export const MAX_DAILY_XP = XP_VALUES.JOURNAL_LOGGED + XP_VALUES.STACK_COMPLETE; // 75 XP

/**
 * Berechnet die XP die für ein bestimmtes Level benötigt werden
 * Formel: 100 * (level - 1)^1.2
 * 
 * Level 2: 100 XP
 * Level 5: 530 XP
 * Level 10: 1370 XP
 * Level 20: 3400 XP
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(100 * Math.pow(level - 1, 1.2));
}

/**
 * Berechnet die kumulative XP die für ein Level benötigt wird
 */
export function getCumulativeXPForLevel(level: number): number {
  let total = 0;
  for (let i = 2; i <= level; i++) {
    total += getXPRequiredForLevel(i);
  }
  return total;
}

/**
 * Berechnet das aktuelle Level basierend auf Gesamt-XP
 */
export function calculateLevel(totalXP: number): number {
  let level = 1;
  let cumulativeXP = 0;
  
  while (true) {
    const nextLevelXP = getXPRequiredForLevel(level + 1);
    if (cumulativeXP + nextLevelXP > totalXP) {
      break;
    }
    cumulativeXP += nextLevelXP;
    level++;
  }
  
  return level;
}

/**
 * Berechnet den Fortschritt zum nächsten Level (0-100%)
 */
export function getLevelProgress(totalXP: number): {
  currentLevel: number;
  xpInCurrentLevel: number;
  xpRequiredForNextLevel: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(totalXP);
  const xpAtCurrentLevel = getCumulativeXPForLevel(currentLevel);
  const xpInCurrentLevel = totalXP - xpAtCurrentLevel;
  const xpRequiredForNextLevel = getXPRequiredForLevel(currentLevel + 1);
  const progressPercent = Math.min(100, Math.round((xpInCurrentLevel / xpRequiredForNextLevel) * 100));
  
  return {
    currentLevel,
    xpInCurrentLevel,
    xpRequiredForNextLevel,
    progressPercent,
  };
}

/**
 * Berechnet Streak-Bonus XP
 */
export function calculateStreakBonus(streak: number): number {
  let bonus = 0;
  
  // Bonus für jeden 7. Tag
  if (streak > 0 && streak % 7 === 0) {
    bonus += XP_VALUES.STREAK_7_DAYS;
  }
  
  // Zusätzlicher Bonus für jeden 30. Tag
  if (streak > 0 && streak % 30 === 0) {
    bonus += XP_VALUES.STREAK_30_DAYS;
  }
  
  return bonus;
}

/**
 * Berechnet die tägliche XP-Vergabe
 */
export function calculateDailyXP(params: {
  journalLogged: boolean;
  stackComplete: boolean;
  streak: number;
  isFirstJournal?: boolean;
  isFirstSupplement?: boolean;
}): {
  journalXP: number;
  stackXP: number;
  streakBonus: number;
  firstTimeBonus: number;
  total: number;
  breakdown: string[];
} {
  const breakdown: string[] = [];
  let journalXP = 0;
  let stackXP = 0;
  let streakBonus = 0;
  let firstTimeBonus = 0;
  
  if (params.journalLogged) {
    journalXP = XP_VALUES.JOURNAL_LOGGED;
    breakdown.push(`Journal: +${journalXP} XP`);
  }
  
  if (params.stackComplete) {
    stackXP = XP_VALUES.STACK_COMPLETE;
    breakdown.push(`Stack Complete: +${stackXP} XP`);
  }
  
  streakBonus = calculateStreakBonus(params.streak);
  if (streakBonus > 0) {
    if (params.streak % 30 === 0) {
      breakdown.push(`30-Tage Streak! +${streakBonus} XP`);
    } else if (params.streak % 7 === 0) {
      breakdown.push(`7-Tage Streak! +${streakBonus} XP`);
    }
  }
  
  if (params.isFirstJournal) {
    firstTimeBonus += XP_VALUES.FIRST_JOURNAL;
    breakdown.push(`Erster Journal-Eintrag: +${XP_VALUES.FIRST_JOURNAL} XP`);
  }
  
  if (params.isFirstSupplement) {
    firstTimeBonus += XP_VALUES.FIRST_SUPPLEMENT;
    breakdown.push(`Erstes Supplement: +${XP_VALUES.FIRST_SUPPLEMENT} XP`);
  }
  
  const total = journalXP + stackXP + streakBonus + firstTimeBonus;
  
  return {
    journalXP,
    stackXP,
    streakBonus,
    firstTimeBonus,
    total,
    breakdown,
  };
}

/**
 * Formatiert XP für Anzeige
 */
export function formatXP(xp: number): string {
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}k`;
  }
  return xp.toString();
}

/**
 * Gibt eine Beschreibung für das Level zurück
 */
export function getLevelTitle(level: number): string {
  if (level <= 5) return 'STAX Novize';
  if (level <= 10) return 'STAX Apprentice';
  if (level <= 20) return 'STAX Adept';
  if (level <= 35) return 'STAX Expert';
  if (level <= 50) return 'STAX Master';
  if (level <= 75) return 'STAX Guru';
  return 'STAX Legend';
}

// Level-Vorschau für UI
export const LEVEL_MILESTONES = [
  { level: 5, title: 'Novize', xp: getCumulativeXPForLevel(5) },
  { level: 10, title: 'Apprentice', xp: getCumulativeXPForLevel(10) },
  { level: 20, title: 'Adept', xp: getCumulativeXPForLevel(20) },
  { level: 35, title: 'Expert', xp: getCumulativeXPForLevel(35) },
  { level: 50, title: 'Master', xp: getCumulativeXPForLevel(50) },
];

