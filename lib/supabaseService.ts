import { supabase, isSupabaseConfigured } from './supabase';
import { SUPPLEMENT_LIBRARY, Supplement } from '@/data/supplements';

// ============================================
// TYPES
// ============================================

export interface StackItem {
    id: string;
    user_id: string;
    supplement_id: string;
    added_at: string;
    custom_dosage?: string;
    custom_time?: string;
    // Supplement data (wird lokal gemappt, nicht aus DB)
    supplement?: Supplement;
}

export interface CheckIn {
    id: string;
    user_id: string;
    supplement_id: string;
    checked_at: string;
    xp_earned: number;
}

export interface DailyMetrics {
    sleep: number;
    energy: number;
    focus: number;
    // Extended metrics (Phase 1)
    mood?: number;
    stress?: number;
    motivation?: number;
    digestion?: number;
    // Context
    tags?: string[];
    notes?: string;
}

// ============================================
// USER STACK OPERATIONS
// ============================================

/**
 * Konvertiert Zeit-Slot zu lesbarem Stack-Namen
 */
export function getStackDisplayName(time?: string): string {
    const timeMap: Record<string, string> = {
        'morning': 'Morning Stack',
        'Morning': 'Morning Stack',
        'noon': 'Noon Stack',
        'Noon': 'Noon Stack',
        'With Meals': 'Noon Stack',
        'evening': 'Evening Stack',
        'Evening': 'Evening Stack',
        'bedtime': 'Bedtime Stack',
        'Bedtime': 'Bedtime Stack',
    };
    return timeMap[time || ''] || 'Stack';
}

/**
 * Supplement zum persönlichen Stack hinzufügen
 */
export async function addToStack(
    userId: string,
    supplementId: string,
    customDosage?: string,
    customTime?: string
): Promise<{ success: boolean; error?: string; data?: StackItem; stackName?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        // Prüfen ob bereits im Stack
        const { data: existing, error: checkError } = await supabase
            .from('user_stack')
            .select('id')
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .maybeSingle();

        if (checkError) {
            console.error('Check existing error:', checkError);
        }

        if (existing) {
            return { success: false, error: 'Supplement ist bereits in deinem Stack' };
        }

        // Hinzufügen
        const { data, error } = await supabase
            .from('user_stack')
            .insert({
                user_id: userId,
                supplement_id: supplementId,
                custom_dosage: customDosage,
                custom_time: customTime
            })
            .select();

        if (error) {
            if (error.code === '23505') {
                return { success: false, error: 'Supplement ist bereits in deinem Stack' };
            }
            console.error('Insert error:', error);
            throw error;
        }

        if (!data || data.length === 0) {
            console.error('Insert succeeded but no data returned');
            return { success: false, error: 'Supplement konnte nicht hinzugefügt werden' };
        }

        const stackName = getStackDisplayName(customTime);
        return { success: true, data: data[0], stackName };
    } catch (error: any) {
        console.error('addToStack error:', error);
        const errorMessage = error.code === '23505' 
            ? 'Supplement ist bereits in deinem Stack'
            : error.message || 'Fehler beim Hinzufügen';
        return { success: false, error: errorMessage };
    }
}

/**
 * Supplement aus dem Stack entfernen
 */
export async function removeFromStack(
    userId: string, 
    supplementId: string
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        const { error } = await supabase
            .from('user_stack')
            .delete()
            .eq('user_id', userId)
            .eq('supplement_id', supplementId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('removeFromStack error:', error);
        return { success: false, error: error.message || 'Fehler beim Entfernen' };
    }
}

/**
 * Alle Supplements des Users laden (ohne JOIN - mappt auf lokale Daten)
 */
export async function getUserStack(userId: string): Promise<StackItem[]> {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('user_stack')
            .select('*')
            .eq('user_id', userId)
            .order('added_at', { ascending: false });

        if (error) throw error;

        // Separate custom supplement IDs
        const customIds = (data || [])
            .filter(item => item.supplement_id.startsWith('custom:'))
            .map(item => item.supplement_id.replace('custom:', ''));

        // Fetch custom supplements from DB if any
        let customSupplements: any[] = [];
        if (customIds.length > 0) {
            const { data: customData } = await supabase
                .from('custom_supplements')
                .select('*')
                .in('id', customIds);
            customSupplements = customData || [];
        }

        // Map supplement data
        const result = (data || []).map(item => {
            // Check if it's a custom supplement
            if (item.supplement_id.startsWith('custom:')) {
                const customId = item.supplement_id.replace('custom:', '');
                const custom = customSupplements.find(c => c.id === customId);
                if (custom) {
                    return {
                        ...item,
                        supplement: {
                            id: `custom:${custom.id}`,
                            name: custom.name,
                            description: custom.description || `Kombi-Präparat mit ${custom.ingredients?.length || 0} Wirkstoffen`,
                            benefits: custom.ingredients?.slice(0, 3).map((i: any) => i.name) || [],
                            evidence_level: 3,
                            optimal_dosage: custom.serving_size || '1 Portion',
                            best_time: custom.best_time || 'With Meals',
                            icon: 'Package',
                            emoji: custom.emoji || '💊',
                            isCustom: true,
                        } as Supplement & { isCustom: boolean }
                    };
                }
            }
            
            // Regular supplement from library
            return {
                ...item,
                supplement: SUPPLEMENT_LIBRARY.find(s => s.id === item.supplement_id)
            };
        });

        return result;
    } catch (error) {
        console.error('getUserStack error:', error);
        return [];
    }
}

/**
 * Nur die supplement_ids aus dem Stack holen (für schnelle "in Stack" Prüfung)
 */
export async function getUserStackIds(userId: string): Promise<string[]> {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('user_stack')
            .select('supplement_id')
            .eq('user_id', userId);

        if (error) throw error;

        return data?.map(item => item.supplement_id) || [];
    } catch (error) {
        console.error('getUserStackIds error:', error);
        return [];
    }
}

/**
 * Prüfen ob ein Supplement bereits im Stack ist
 */
export async function isInStack(userId: string, supplementId: string): Promise<boolean> {
    if (!supabase) return false;
    
    try {
        const { data } = await supabase
            .from('user_stack')
            .select('id')
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .single();

        return !!data;
    } catch {
        return false;
    }
}

/**
 * Stack-Item aktualisieren (Dosierung, Einnahmezeit)
 */
export async function updateStackItem(
    userId: string,
    supplementId: string,
    updates: { custom_dosage?: string; custom_time?: string }
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        const { error } = await supabase
            .from('user_stack')
            .update(updates)
            .eq('user_id', userId)
            .eq('supplement_id', supplementId);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('updateStackItem error:', error);
        return { success: false, error: error.message || 'Aktualisierung fehlgeschlagen' };
    }
}

// ============================================
// CHECK-IN / XP OPERATIONS
// ============================================

/**
 * Check-in für ein Supplement loggen
 * HINWEIS: XP wird NICHT mehr pro Supplement vergeben!
 * XP wird jetzt über calculateUserXP() basierend auf:
 * - Journal geloggt: 50 XP/Tag
 * - Stack 100%: 25 XP/Tag
 * - Streak-Boni
 */
export async function logCheckIn(
    userId: string, 
    supplementId: string,
    _xpEarned: number = 0 // Deprecated - nicht mehr verwendet
): Promise<{ success: boolean; error?: string; data?: CheckIn }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        // Prüfen ob heute bereits eingecheckt
        const today = new Date().toISOString().split('T')[0];
        
        const { data: existing } = await supabase
            .from('check_ins')
            .select('id')
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .gte('checked_at', `${today}T00:00:00`)
            .lte('checked_at', `${today}T23:59:59`)
            .single();

        if (existing) {
            return { success: false, error: 'Bereits heute eingecheckt' };
        }

        const { data, error } = await supabase
            .from('check_ins')
            .insert({
                user_id: userId,
                supplement_id: supplementId,
                xp_earned: 0 // XP wird jetzt über calculateUserXP() berechnet
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error: any) {
        console.error('logCheckIn error:', error);
        return { success: false, error: error.message || 'Check-in fehlgeschlagen' };
    }
}

/**
 * Check-in für heute rückgängig machen (löschen)
 */
export async function undoCheckIn(
    userId: string,
    supplementId: string
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { error } = await supabase
            .from('check_ins')
            .delete()
            .eq('user_id', userId)
            .eq('supplement_id', supplementId)
            .gte('checked_at', `${today}T00:00:00`)
            .lte('checked_at', `${today}T23:59:59`);

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('undoCheckIn error:', error);
        return { success: false, error: error.message || 'Fehler beim Rückgängigmachen' };
    }
}

/**
 * Holt die supplement_ids aller Check-Ins von heute
 */
export async function getTodayCheckIns(userId: string): Promise<string[]> {
    if (!supabase) return [];
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('check_ins')
            .select('supplement_id')
            .eq('user_id', userId)
            .gte('checked_at', `${today}T00:00:00`)
            .lte('checked_at', `${today}T23:59:59`);

        if (error) throw error;

        return data?.map(c => c.supplement_id).filter(Boolean) as string[] || [];
    } catch (error) {
        console.error('getTodayCheckIns error:', error);
        return [];
    }
}

/**
 * Gesamtes XP des Users berechnen
 * 
 * Neues XP-System:
 * - Journal geloggt: 50 XP pro Tag
 * - Stack 100% erledigt: 25 XP pro Tag
 * - 7-Tage Streak: +50 XP Bonus
 * - 30-Tage Streak: +100 XP Bonus
 */
export async function getUserXP(userId: string): Promise<number> {
    if (!supabase) return 0;
    
    try {
        // 1. Alle Tage mit Journal-Einträgen zählen
        const { data: journalDays, error: journalError } = await supabase
            .from('daily_metrics')
            .select('date')
            .eq('user_id', userId);

        if (journalError) throw journalError;

        const journalXP = (journalDays?.length || 0) * 50; // 50 XP pro Journal-Tag

        // 2. Tage mit 100% Stack-Completion berechnen
        // Dafür brauchen wir Stack-Größe pro Tag und Check-Ins pro Tag
        const { data: checkIns, error: checkInError } = await supabase
            .from('check_ins')
            .select('checked_at, supplement_id')
            .eq('user_id', userId);

        if (checkInError) throw checkInError;

        // Stack-Größe holen (aktuelle Größe als Approximation)
        const { data: stack, error: stackError } = await supabase
            .from('user_stack')
            .select('id')
            .eq('user_id', userId);

        if (stackError) throw stackError;

        const stackSize = stack?.length || 0;

        // Check-Ins pro Tag gruppieren
        const checkInsPerDay = new Map<string, Set<string>>();
        (checkIns || []).forEach(ci => {
            const date = ci.checked_at.split('T')[0];
            if (!checkInsPerDay.has(date)) {
                checkInsPerDay.set(date, new Set());
            }
            checkInsPerDay.get(date)!.add(ci.supplement_id);
        });

        // Tage mit 100% Completion zählen (nur wenn Stack > 0)
        let completeStackDays = 0;
        if (stackSize > 0) {
            checkInsPerDay.forEach((supplements) => {
                if (supplements.size >= stackSize) {
                    completeStackDays++;
                }
            });
        }

        const stackXP = completeStackDays * 25; // 25 XP pro 100%-Tag

        // 3. Streak-Bonus berechnen
        const streak = await getUserStreak(userId);
        let streakBonusXP = 0;
        
        // Bonus für jede abgeschlossene 7-Tage-Periode
        const weeklyBonuses = Math.floor(streak / 7);
        streakBonusXP += weeklyBonuses * 50;

        // Zusätzlicher Bonus für jede abgeschlossene 30-Tage-Periode
        const monthlyBonuses = Math.floor(streak / 30);
        streakBonusXP += monthlyBonuses * 100;

        // 4. Legacy XP aus alten Check-Ins (für bestehende User)
        // Summiere alte xp_earned Werte, falls vorhanden
        const legacyXP = (checkIns || []).reduce((sum, ci) => {
            // Nur alte XP zählen wenn > 0 (alte Einträge)
            return sum + ((ci as any).xp_earned || 0);
        }, 0);

        // Gesamt-XP = Journal + Stack + Streak + Legacy
        // Legacy wird nur einmal gezählt, nicht doppelt
        const totalXP = journalXP + stackXP + streakBonusXP;

        return totalXP;
    } catch (error) {
        console.error('getUserXP error:', error);
        return 0;
    }
}

/**
 * Streak berechnen (aufeinanderfolgende Tage mit Check-ins)
 */
export async function getUserStreak(userId: string): Promise<number> {
    if (!supabase) return 0;
    
    try {
        const { data, error } = await supabase
            .from('check_ins')
            .select('checked_at')
            .eq('user_id', userId)
            .order('checked_at', { ascending: false });

        if (error || !data || data.length === 0) return 0;

        // Unique Tage extrahieren
        const uniqueDays = [...new Set(
            data.map(c => new Date(c.checked_at).toISOString().split('T')[0])
        )].sort().reverse();

        if (uniqueDays.length === 0) return 0;

        // Streak zählen
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

        // Streak nur zählen wenn heute oder gestern gecheckt wurde
        if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) {
            return 0;
        }

        for (let i = 0; i < uniqueDays.length; i++) {
            const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
            if (uniqueDays[i] === expectedDate) {
                streak++;
            } else {
                break;
            }
        }

        return streak;
    } catch (error) {
        console.error('getUserStreak error:', error);
        return 0;
    }
}

// ============================================
// JOURNAL / DAILY METRICS
// ============================================

export interface MetricsHistoryItem {
    date: string;
    sleep: number;
    energy: number;
    focus: number;
}

/**
 * Tägliche Metriken speichern
 */
export async function saveDailyMetrics(
    userId: string, 
    metrics: DailyMetrics
): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
        return { success: false, error: 'Supabase nicht konfiguriert' };
    }
    
    try {
        const today = new Date().toISOString().split('T')[0];

        // Upsert: Update falls heute schon existiert, sonst Insert
        const { error } = await supabase
            .from('daily_metrics')
            .upsert({
                user_id: userId,
                date: today,
                sleep_quality: metrics.sleep,
                energy_level: metrics.energy,
                focus_score: metrics.focus,
                // Extended metrics
                mood_score: metrics.mood,
                stress_level: metrics.stress,
                motivation_score: metrics.motivation,
                digestion_score: metrics.digestion,
                // Context
                tags: metrics.tags,
                notes: metrics.notes
            }, {
                onConflict: 'user_id,date'
            });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        console.error('saveDailyMetrics error:', error);
        return { success: false, error: error.message || 'Speichern fehlgeschlagen' };
    }
}

/**
 * Prüft ob für heute bereits ein Journal-Eintrag existiert und gibt ihn zurück
 */
export async function getTodayMetrics(userId: string): Promise<{
    exists: boolean;
    data?: {
        sleep: number;
        energy: number;
        focus: number;
        mood?: number;
        stress?: number;
        motivation?: number;
        digestion?: number;
        tags?: string[];
        notes?: string;
        created_at?: string;
    };
}> {
    if (!supabase) return { exists: false };
    
    try {
        const today = new Date().toISOString().split('T')[0];
        
        const { data, error } = await supabase
            .from('daily_metrics')
            .select('*')
            .eq('user_id', userId)
            .eq('date', today)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            return {
                exists: true,
                data: {
                    sleep: data.sleep_quality || 5,
                    energy: data.energy_level || 5,
                    focus: data.focus_score || 5,
                    mood: data.mood_score,
                    stress: data.stress_level,
                    motivation: data.motivation_score,
                    digestion: data.digestion_score,
                    tags: data.tags,
                    notes: data.notes,
                    created_at: data.created_at,
                }
            };
        }

        return { exists: false };
    } catch (error) {
        console.error('getTodayMetrics error:', error);
        return { exists: false };
    }
}

/**
 * Metriken der letzten X Tage laden
 */
export async function getMetricsHistory(
    userId: string, 
    days: number = 7
): Promise<MetricsHistoryItem[]> {
    if (!supabase) return [];
    
    try {
        const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('daily_metrics')
            .select('date, sleep_quality, energy_level, focus_score')
            .eq('user_id', userId)
            .gte('date', startDate)
            .order('date', { ascending: true });

        if (error) throw error;

        // Map to normalized format
        return (data || []).map(item => ({
            date: item.date,
            sleep: item.sleep_quality || 5,
            energy: item.energy_level || 5,
            focus: item.focus_score || 5
        }));
    } catch (error) {
        console.error('getMetricsHistory error:', error);
        return [];
    }
}

// ============================================
// STATS & ANALYTICS
// ============================================

export interface SupplementStats {
    supplementId: string;
    supplementName: string;
    totalCheckIns: number;
    currentStreak: number;
    longestStreak: number;
    adherencePercent: number;
    checkInDates: string[];
}

export interface DailyStats {
    date: string;
    checkIns: number;
    supplements: string[];
    sleep?: number;
    energy?: number;
    focus?: number;
}

/**
 * Check-In Historie für einen Zeitraum laden
 */
export async function getCheckInHistory(
    userId: string,
    days: number = 30
): Promise<{ supplementId: string; checkedAt: string }[]> {
    if (!supabase) return [];
    
    try {
        const startDate = new Date(Date.now() - days * 86400000).toISOString();
        
        const { data, error } = await supabase
            .from('check_ins')
            .select('supplement_id, checked_at')
            .eq('user_id', userId)
            .gte('checked_at', startDate)
            .order('checked_at', { ascending: true });

        if (error) throw error;

        return (data || []).map(item => ({
            supplementId: item.supplement_id,
            checkedAt: item.checked_at
        }));
    } catch (error) {
        console.error('getCheckInHistory error:', error);
        return [];
    }
}

/**
 * Tägliche Stats für einen Zeitraum laden (Check-Ins + Metriken kombiniert)
 */
export async function getDailyStats(
    userId: string,
    days: number = 30
): Promise<DailyStats[]> {
    if (!supabase) return [];
    
    try {
        const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
        
        // Check-Ins laden
        const { data: checkIns, error: checkInError } = await supabase
            .from('check_ins')
            .select('supplement_id, checked_at')
            .eq('user_id', userId)
            .gte('checked_at', `${startDate}T00:00:00`)
            .order('checked_at', { ascending: true });

        if (checkInError) throw checkInError;

        // Metriken laden
        const { data: metrics, error: metricsError } = await supabase
            .from('daily_metrics')
            .select('date, sleep_quality, energy_level, focus_score')
            .eq('user_id', userId)
            .gte('date', startDate)
            .order('date', { ascending: true });

        if (metricsError) throw metricsError;

        // Kombinieren nach Tag
        const statsMap = new Map<string, DailyStats>();
        
        // Alle Tage im Zeitraum initialisieren
        for (let i = 0; i < days; i++) {
            const date = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().split('T')[0];
            statsMap.set(date, {
                date,
                checkIns: 0,
                supplements: []
            });
        }

        // Check-Ins einfügen
        (checkIns || []).forEach(ci => {
            const date = ci.checked_at.split('T')[0];
            const existing = statsMap.get(date);
            if (existing) {
                existing.checkIns++;
                existing.supplements.push(ci.supplement_id);
            }
        });

        // Metriken einfügen
        (metrics || []).forEach(m => {
            const existing = statsMap.get(m.date);
            if (existing) {
                existing.sleep = m.sleep_quality;
                existing.energy = m.energy_level;
                existing.focus = m.focus_score;
            }
        });

        return Array.from(statsMap.values());
    } catch (error) {
        console.error('getDailyStats error:', error);
        return [];
    }
}

/**
 * Stats pro Supplement berechnen
 */
export async function getSupplementStats(
    userId: string,
    days: number = 30
): Promise<SupplementStats[]> {
    if (!supabase) return [];
    
    try {
        const startDate = new Date(Date.now() - days * 86400000).toISOString();
        
        // Alle Check-Ins im Zeitraum
        const { data, error } = await supabase
            .from('check_ins')
            .select('supplement_id, checked_at')
            .eq('user_id', userId)
            .gte('checked_at', startDate)
            .order('checked_at', { ascending: true });

        if (error) throw error;

        // User Stack laden für Namen
        const stack = await getUserStack(userId);
        const supplementMap = new Map(stack.map(s => [s.supplement_id, s.supplement?.name || s.supplement_id]));

        // Stats pro Supplement berechnen
        const statsMap = new Map<string, {
            dates: Set<string>;
            allDates: string[];
        }>();

        (data || []).forEach(ci => {
            const date = ci.checked_at.split('T')[0];
            if (!statsMap.has(ci.supplement_id)) {
                statsMap.set(ci.supplement_id, { dates: new Set(), allDates: [] });
            }
            const stat = statsMap.get(ci.supplement_id)!;
            stat.dates.add(date);
            stat.allDates.push(date);
        });

        // Streak berechnen
        const calculateStreak = (dates: string[]): { current: number; longest: number } => {
            if (dates.length === 0) return { current: 0, longest: 0 };
            
            const sortedDates = [...new Set(dates)].sort().reverse();
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            let current = 0;
            let longest = 0;
            let tempStreak = 0;
            
            // Current streak (muss heute oder gestern starten)
            if (sortedDates[0] === today || sortedDates[0] === yesterday) {
                for (let i = 0; i < sortedDates.length; i++) {
                    const expectedDate = new Date(Date.now() - i * 86400000).toISOString().split('T')[0];
                    if (sortedDates.includes(expectedDate)) {
                        current++;
                    } else {
                        break;
                    }
                }
            }
            
            // Longest streak
            const allSorted = [...new Set(dates)].sort();
            for (let i = 0; i < allSorted.length; i++) {
                if (i === 0) {
                    tempStreak = 1;
                } else {
                    const prev = new Date(allSorted[i - 1]);
                    const curr = new Date(allSorted[i]);
                    const diffDays = (curr.getTime() - prev.getTime()) / 86400000;
                    if (diffDays === 1) {
                        tempStreak++;
                    } else {
                        tempStreak = 1;
                    }
                }
                longest = Math.max(longest, tempStreak);
            }
            
            return { current, longest };
        };

        const results: SupplementStats[] = [];
        
        statsMap.forEach((stat, supplementId) => {
            const streaks = calculateStreak(stat.allDates);
            results.push({
                supplementId,
                supplementName: supplementMap.get(supplementId) || supplementId,
                totalCheckIns: stat.dates.size,
                currentStreak: streaks.current,
                longestStreak: streaks.longest,
                adherencePercent: Math.round((stat.dates.size / days) * 100),
                checkInDates: [...stat.dates].sort()
            });
        });

        // Sortieren nach Adherence
        return results.sort((a, b) => b.adherencePercent - a.adherencePercent);
    } catch (error) {
        console.error('getSupplementStats error:', error);
        return [];
    }
}

// ============================================
// SUPPLEMENT LIBRARY (Read-only)
// ============================================

/**
 * Alle Supplements aus der Library laden
 */
export async function getSupplementLibrary() {
    if (!supabase) return [];
    
    try {
        const { data, error } = await supabase
            .from('supplement_library')
            .select('*')
            .order('name');

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('getSupplementLibrary error:', error);
        return [];
    }
}

// ============================================
// QUEST STATS
// ============================================

export interface QuestStatsResult {
    totalCompleted: number;
    beginnerCompleted: number;
    intermediateCompleted: number;
    advancedCompleted: number;
    beastCompleted: number;
    completedQuestIds: string[];
}

/**
 * Quest-Statistiken für Badges laden
 */
export async function getQuestStats(userId: string): Promise<QuestStatsResult> {
    if (!supabase) {
        return {
            totalCompleted: 0,
            beginnerCompleted: 0,
            intermediateCompleted: 0,
            advancedCompleted: 0,
            beastCompleted: 0,
            completedQuestIds: [],
        };
    }
    
    try {
        const { data, error } = await supabase
            .from('user_quests')
            .select('id, title, category, status')
            .eq('user_id', userId)
            .eq('status', 'completed');

        if (error) throw error;

        const completedQuests = data || [];
        
        // Zähle nach Schwierigkeit (basierend auf XP oder Kategorie)
        // Da wir die Schwierigkeit nicht direkt speichern, müssen wir sie aus den Titeln ableiten
        // oder einen separaten difficulty-Feld in der DB haben
        
        // Für jetzt: Wir nutzen eine einfache Heuristik basierend auf dem Quest-Titel
        const questDifficultyMap: Record<string, 'Beginner' | 'Intermediate' | 'Advanced' | 'Beast'> = {
            'hydration-hero': 'Beginner',
            'morning-light': 'Beginner',
            'digital-sunset': 'Beginner',
            'protein-power': 'Beginner',
            'cold-shower': 'Intermediate',
            'box-breathing': 'Intermediate',
            'fasting-16-8': 'Intermediate',
            'zone-2': 'Intermediate',
            'mouth-taping': 'Advanced',
            'ice-bath': 'Advanced',
            'monk-mode': 'Advanced',
            'extended-fast': 'Beast',
            'norse-god': 'Beast',
            'dark-retreat': 'Beast',
        };

        let beginnerCount = 0;
        let intermediateCount = 0;
        let advancedCount = 0;
        let beastCount = 0;
        const completedIds: string[] = [];

        completedQuests.forEach(quest => {
            completedIds.push(quest.id);
            
            // Versuche die Schwierigkeit zu ermitteln
            const titleLower = quest.title.toLowerCase();
            
            // Prüfe gegen bekannte Quest-Namen
            for (const [questId, difficulty] of Object.entries(questDifficultyMap)) {
                if (titleLower.includes(questId.replace('-', ' ')) || titleLower.includes(questId)) {
                    switch (difficulty) {
                        case 'Beginner': beginnerCount++; break;
                        case 'Intermediate': intermediateCount++; break;
                        case 'Advanced': advancedCount++; break;
                        case 'Beast': beastCount++; break;
                    }
                    break;
                }
            }
            
            // Fallback: Helix-generierte Quests als Intermediate zählen
            if (!Object.keys(questDifficultyMap).some(k => titleLower.includes(k.replace('-', ' ')))) {
                intermediateCount++;
            }
        });

        return {
            totalCompleted: completedQuests.length,
            beginnerCompleted: beginnerCount,
            intermediateCompleted: intermediateCount,
            advancedCompleted: advancedCount,
            beastCompleted: beastCount,
            completedQuestIds: completedIds,
        };
    } catch (error) {
        console.error('getQuestStats error:', error);
        return {
            totalCompleted: 0,
            beginnerCompleted: 0,
            intermediateCompleted: 0,
            advancedCompleted: 0,
            beastCompleted: 0,
            completedQuestIds: [],
        };
    }
}

