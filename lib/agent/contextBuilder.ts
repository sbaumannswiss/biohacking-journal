import { supabase } from '@/lib/supabase';
import { getUserStack, getUserXP, getUserStreak, getMetricsHistory, getTodayCheckIns, getCheckInHistory, getOnboardingProfile, OnboardingProfile } from '@/lib/supabaseService';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';
import { createRecommendationService, Recommendation, JournalEntry, CheckInData, findStackWarnings, SupplementWarning, UserProfile } from '@/lib/recommendations';
import { calculateLevel } from '@/lib/xpSystem';

export interface UserContext {
  user: {
    id: string;
    streak: number;
    xp: number;
    level: number;
  };
  profile?: UserProfile;
  stack: {
    id: string;
    name: string;
    dosage: string;
    time: string;
  }[];
  metrics_last_7_days: {
    date: string;
    sleep: number;
    energy: number;
    focus: number;
    mood?: number;
    stress?: number;
  }[];
  checkins_today: string[];
  averages: {
    sleep: number;
    energy: number;
    focus: number;
    mood: number;
    stress: number;
  } | null;
  patterns: {
    supplement: string;
    metric: string;
    with_value: number;
    without_value: number;
    difference_percent: number;
    direction: 'positive' | 'negative' | 'neutral';
  }[];
  recommendations: {
    type: string;
    priority: string;
    title: string;
    message: string;
    supplement?: string;
  }[];
  warnings: {
    type: string;
    severity: string;
    message: string;
    supplements?: string[];
  }[];
  today: {
    date: string;
    time: string;
    is_first_session: boolean;
  };
}

/**
 * Konvertiert OnboardingProfile zu UserProfile für Recommendations
 */
function convertToUserProfile(onboarding: OnboardingProfile | null): UserProfile | undefined {
  if (!onboarding) return undefined;
  
  return {
    name: onboarding.name,
    ageGroup: onboarding.ageGroup,
    gender: onboarding.gender,
    weight: onboarding.weight,
    chronotype: onboarding.chronotype as UserProfile['chronotype'],
    activityLevel: onboarding.activityLevel as UserProfile['activityLevel'],
    caffeineLevel: onboarding.caffeineLevel as UserProfile['caffeineLevel'],
    dietType: onboarding.dietType,
    allergies: onboarding.allergies,
    medications: onboarding.medications,
    goals: onboarding.goals,
    wearables: onboarding.wearables,
  };
}

// calculateLevel aus @/lib/xpSystem importiert

function calculateAverages(metrics: any[]): UserContext['averages'] {
  if (metrics.length === 0) return null;
  
  // Note: mood and stress are not tracked in current schema, use energy as proxy
  const sum = metrics.reduce((acc, m) => ({
    sleep: acc.sleep + (m.sleep || 0),
    energy: acc.energy + (m.energy || 0),
    focus: acc.focus + (m.focus || 0),
  }), { sleep: 0, energy: 0, focus: 0 });
  
  const count = metrics.length;
  const avgEnergy = Math.round((sum.energy / count) * 10) / 10;
  
  return {
    sleep: Math.round((sum.sleep / count) * 10) / 10,
    energy: avgEnergy,
    focus: Math.round((sum.focus / count) * 10) / 10,
    mood: avgEnergy, // Use energy as proxy for mood
    stress: Math.max(1, 10 - avgEnergy), // Inverse of energy as proxy for stress
  };
}

// Simple pattern detection - compares metrics on days with/without supplement
function detectPatterns(
  metrics: any[], 
  checkins: any[], 
  stack: any[]
): UserContext['patterns'] {
  const patterns: UserContext['patterns'] = [];
  
  if (metrics.length < 7 || !checkins.length) return patterns;
  
  // For each supplement in stack
  for (const supplement of stack) {
    const metricsWithSupp: any[] = [];
    const metricsWithoutSupp: any[] = [];
    
    for (const metric of metrics) {
      const date = metric.date;
      const checkin = checkins.find((c: any) => c.date === date);
      
      if (checkin?.supplements?.includes(supplement.id)) {
        metricsWithSupp.push(metric);
      } else {
        metricsWithoutSupp.push(metric);
      }
    }
    
    if (metricsWithSupp.length >= 3 && metricsWithoutSupp.length >= 3) {
      // Compare focus
      const focusWith = metricsWithSupp.reduce((sum, m) => sum + (m.focus || 0), 0) / metricsWithSupp.length;
      const focusWithout = metricsWithoutSupp.reduce((sum, m) => sum + (m.focus || 0), 0) / metricsWithoutSupp.length;
      
      const diff = ((focusWith - focusWithout) / focusWithout) * 100;
      
      if (Math.abs(diff) > 15) {
        patterns.push({
          supplement: supplement.name,
          metric: 'focus',
          with_value: Math.round(focusWith * 10) / 10,
          without_value: Math.round(focusWithout * 10) / 10,
          difference_percent: Math.round(diff),
          direction: diff > 0 ? 'positive' : 'negative',
        });
      }
    }
  }
  
  return patterns;
}

export async function buildUserContext(userId: string): Promise<UserContext> {
  // Fetch all data in parallel (including profile)
  const [stack, xp, streak, metricsRaw, todayCheckIns, checkInHistoryRaw, onboardingProfile] = await Promise.all([
    getUserStack(userId),
    getUserXP(userId),
    getUserStreak(userId),
    getMetricsHistory(userId, 30), // Erweitert auf 30 Tage für bessere Analyse
    getTodayCheckIns(userId),
    getCheckInHistory(userId, 30),
    getOnboardingProfile(userId),
  ]);
  
  // Convert onboarding profile to UserProfile
  const profile = convertToUserProfile(onboardingProfile);
  
  // Format stack with supplement info
  const formattedStack = stack.map(item => {
    const supp = SUPPLEMENT_LIBRARY.find(s => s.id === item.supplement_id);
    return {
      id: item.supplement_id,
      name: supp?.name || item.supplement_id,
      dosage: item.custom_dosage || supp?.optimal_dosage || '',
      time: item.custom_time || supp?.best_time || '',
    };
  });
  
  // Format metrics (mood and stress not stored in daily_metrics, use defaults)
  const metrics = metricsRaw.map(m => ({
    date: m.date,
    sleep: m.sleep || 0,
    energy: m.energy || 0,
    focus: m.focus || 0,
    mood: 5, // Default - not tracked in current schema
    stress: 5, // Default - not tracked in current schema
  }));
  
  // Calculate averages
  const averages = calculateAverages(metricsRaw);
  
  // Detect patterns (simplified)
  const patterns = detectPatterns(metricsRaw, [], formattedStack);
  
  // Generate recommendations using the new system
  let recommendations: UserContext['recommendations'] = [];
  try {
    const journalHistory: JournalEntry[] = metricsRaw.map(m => ({
      date: m.date,
      sleep: m.sleep || 5,
      energy: m.energy || 5,
      focus: m.focus || 5,
      mood: m.energy || 5, // Use energy as proxy for mood
    }));
    
    const checkInHistory: CheckInData[] = checkInHistoryRaw.map((c: { supplementId: string; checkedAt: string }) => ({
      supplementId: c.supplementId,
      supplementName: formattedStack.find(s => s.id === c.supplementId)?.name || c.supplementId,
      checkedAt: c.checkedAt,
      time: getTimeOfDayFromDate(c.checkedAt),
    }));
    
    const currentStack = formattedStack.map(s => ({
      supplementId: s.id,
      supplementName: s.name,
      dosage: s.dosage,
      time: s.time,
    }));
    
    const recService = createRecommendationService(userId, journalHistory, checkInHistory, currentStack);
    const topRecs = recService.getTopRecommendations(5);
    
    recommendations = topRecs.map(r => ({
      type: r.type,
      priority: r.priority,
      title: r.title,
      message: r.message,
      supplement: r.supplement,
    }));
  } catch (e) {
    // Silently fail - recommendations are optional
  }
  
  // Generate warnings for dangerous combinations or dosages
  let warnings: UserContext['warnings'] = [];
  try {
    const warningContext = {
      userId,
      profile, // Include user profile for medication warnings
      journalHistory: metricsRaw.map(m => ({
        date: m.date,
        sleep: m.sleep || 5,
        energy: m.energy || 5,
        focus: m.focus || 5,
        mood: m.energy || 5,
      })),
      checkInHistory: checkInHistoryRaw.map((c: { supplementId: string; checkedAt: string }) => ({
        supplementId: c.supplementId,
        supplementName: formattedStack.find(s => s.id === c.supplementId)?.name || c.supplementId,
        checkedAt: c.checkedAt,
        time: getTimeOfDayFromDate(c.checkedAt),
      })),
      currentStack: formattedStack.map(s => ({
        supplementId: s.id,
        supplementName: s.name,
        dosage: s.dosage,
        time: s.time,
      })),
    };
    
    const stackWarnings = findStackWarnings(warningContext);
    warnings = stackWarnings.map(w => ({
      type: w.type,
      severity: w.severity,
      message: w.message,
      supplements: w.affectedSupplements,
    }));
  } catch (e) {
    // Silently fail - warnings are optional
  }
  
  // Check if first session
  const isFirstSession = stack.length === 0 && metricsRaw.length === 0;
  
  const now = new Date();
  
  return {
    user: {
      id: userId,
      streak,
      xp,
      level: calculateLevel(xp),
    },
    profile,
    stack: formattedStack,
    metrics_last_7_days: metrics.slice(0, 7), // Nur letzte 7 Tage für Anzeige
    checkins_today: todayCheckIns,
    averages,
    patterns,
    recommendations,
    warnings,
    today: {
      date: now.toISOString().split('T')[0],
      time: now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
      is_first_session: isFirstSession,
    },
  };
}

function getTimeOfDayFromDate(dateStr: string): 'morning' | 'noon' | 'evening' | 'bedtime' {
  const date = new Date(dateStr);
  const hour = date.getHours();
  if (hour >= 5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 22) return 'evening';
  return 'bedtime';
}

export function formatContextForPrompt(context: UserContext): string {
  return `
USER_CONTEXT:
- User ID: ${context.user.id}
- Streak: ${context.user.streak} Tage
- Level: ${context.user.level}
- XP: ${context.user.xp}

STACK (${context.stack.length} Supplements):
${context.stack.length > 0 
  ? context.stack.map(s => `- ${s.name} (${s.dosage}, ${s.time})`).join('\n')
  : '- Noch keine Supplements im Stack'
}

METRIKEN (letzte 7 Tage):
${context.metrics_last_7_days.length > 0
  ? context.metrics_last_7_days.map(m => 
      `- ${m.date}: Schlaf ${m.sleep}/10, Energie ${m.energy}/10, Fokus ${m.focus}/10`
    ).join('\n')
  : '- Noch keine Metriken vorhanden'
}

DURCHSCHNITTE:
${context.averages 
  ? `- Schlaf: ${context.averages.sleep}/10
- Energie: ${context.averages.energy}/10
- Fokus: ${context.averages.focus}/10
- Stimmung: ${context.averages.mood}/10
- Stress: ${context.averages.stress}/10`
  : '- Noch nicht genug Daten'
}

ERKANNTE MUSTER:
${context.patterns.length > 0
  ? context.patterns.map(p => 
      `- ${p.supplement} → ${p.metric}: ${p.with_value} vs ${p.without_value} (${p.difference_percent > 0 ? '+' : ''}${p.difference_percent}%)`
    ).join('\n')
  : '- Noch keine Muster erkannt (mehr Daten nötig)'
}

PERSONALISIERTE EMPFEHLUNGEN:
${context.recommendations.length > 0
  ? context.recommendations.map(r => 
      `- [${r.priority.toUpperCase()}] ${r.title}: ${r.message}`
    ).join('\n')
  : '- Noch nicht genug Daten für personalisierte Empfehlungen'
}

WARNUNGEN (WICHTIG - User muss informiert werden!):
${context.warnings.length > 0
  ? context.warnings.map(w => 
      `- [${w.severity.toUpperCase()}] ${w.type}: ${w.message}${w.supplements ? ` (betrifft: ${w.supplements.join(', ')})` : ''}`
    ).join('\n')
  : '- Keine Warnungen für den aktuellen Stack'
}

HEUTE:
- Datum: ${context.today.date}
- Uhrzeit: ${context.today.time}
- Erster Besuch: ${context.today.is_first_session ? 'Ja' : 'Nein'}
- Check-ins heute: ${context.checkins_today.length > 0 ? context.checkins_today.join(', ') : 'Noch keine'}

SUPPLEMENT-LIBRARY (${SUPPLEMENT_LIBRARY.length} Supplements bereits vorhanden):
${SUPPLEMENT_LIBRARY.map(s => s.name.toLowerCase()).join(', ')}
`.trim();
}

