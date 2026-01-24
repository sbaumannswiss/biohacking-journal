import { Capacitor } from '@capacitor/core';
import { TimeOfDay } from '@/types';
import { 
    CalendarSettings, 
    CalendarSyncState, 
    CalendarTimeSlot,
    DEFAULT_CALENDAR_SETTINGS,
    DEFAULT_CALENDAR_TIMES,
} from './types';
import { 
    getCalendarPlugin, 
    hasCalendarWritePermission, 
    isCalendarAvailable,
    requestAllCalendarPermissions,
} from './calendarPermissions';

// ============================================
// LOCAL STORAGE KEYS
// ============================================

const STORAGE_KEY_SETTINGS = 'stax_calendar_settings';
const STORAGE_KEY_SYNC_STATE = 'stax_calendar_sync_state';

// ============================================
// SETTINGS MANAGEMENT
// ============================================

/**
 * Lädt die Kalender-Einstellungen aus dem LocalStorage
 */
export function getCalendarSettings(): CalendarSettings {
    if (typeof window === 'undefined') {
        return DEFAULT_CALENDAR_SETTINGS;
    }
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SETTINGS);
        if (stored) {
            return { ...DEFAULT_CALENDAR_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (error) {
        console.error('Error loading calendar settings:', error);
    }
    
    return DEFAULT_CALENDAR_SETTINGS;
}

/**
 * Speichert die Kalender-Einstellungen
 */
export function saveCalendarSettings(settings: Partial<CalendarSettings>): CalendarSettings {
    const current = getCalendarSettings();
    const updated = { ...current, ...settings };
    
    try {
        localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(updated));
    } catch (error) {
        console.error('Error saving calendar settings:', error);
    }
    
    return updated;
}

/**
 * Aktualisiert die benutzerdefinierte Zeit für einen TimeOfDay-Slot
 */
export function updateCustomTime(timeOfDay: TimeOfDay, time: CalendarTimeSlot): CalendarSettings {
    const settings = getCalendarSettings();
    const updatedTimes = { ...settings.customTimes, [timeOfDay]: time };
    return saveCalendarSettings({ customTimes: updatedTimes });
}

// ============================================
// SYNC STATE MANAGEMENT
// ============================================

/**
 * Lädt den Sync-Status aus dem LocalStorage
 */
export function getCalendarSyncState(): CalendarSyncState {
    if (typeof window === 'undefined') {
        return { lastSyncAt: null, syncedSupplementIds: [], eventIds: {} };
    }
    
    try {
        const stored = localStorage.getItem(STORAGE_KEY_SYNC_STATE);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error('Error loading calendar sync state:', error);
    }
    
    return { lastSyncAt: null, syncedSupplementIds: [], eventIds: {} };
}

/**
 * Speichert den Sync-Status
 */
function saveSyncState(state: CalendarSyncState): void {
    try {
        localStorage.setItem(STORAGE_KEY_SYNC_STATE, JSON.stringify(state));
    } catch (error) {
        console.error('Error saving calendar sync state:', error);
    }
}

/**
 * Speichert eine Event-ID für ein Supplement
 */
function saveEventMapping(supplementId: string, eventId: string): void {
    const state = getCalendarSyncState();
    state.eventIds[supplementId] = eventId;
    if (!state.syncedSupplementIds.includes(supplementId)) {
        state.syncedSupplementIds.push(supplementId);
    }
    state.lastSyncAt = new Date().toISOString();
    saveSyncState(state);
}

/**
 * Entfernt das Event-Mapping für ein Supplement
 */
function removeEventMapping(supplementId: string): void {
    const state = getCalendarSyncState();
    delete state.eventIds[supplementId];
    state.syncedSupplementIds = state.syncedSupplementIds.filter(id => id !== supplementId);
    saveSyncState(state);
}

// ============================================
// CALENDAR EVENT OPERATIONS
// ============================================

interface SupplementForCalendar {
    id: string;
    name: string;
    dosage?: string;
    defaultTime: TimeOfDay;
}

/**
 * Konvertiert TimeOfDay + Datum zu einem Timestamp
 */
function getTimestampForTimeOfDay(
    date: Date, 
    timeOfDay: TimeOfDay, 
    customTimes?: Record<TimeOfDay, CalendarTimeSlot>
): number {
    const times = customTimes || DEFAULT_CALENDAR_TIMES;
    const time = times[timeOfDay];
    
    const result = new Date(date);
    result.setHours(time.hour, time.minute, 0, 0);
    
    return result.getTime();
}

/**
 * Erstellt einen Kalender-Event für ein Supplement
 * Gibt die Event-ID zurück oder null bei Fehler
 */
export async function createSupplementCalendarEvent(
    supplement: SupplementForCalendar,
    startDate: Date,
    options?: {
        alertMinutesBefore?: number;
        isRecurring?: boolean;
        customTimes?: Record<TimeOfDay, CalendarTimeSlot>;
    }
): Promise<string | null> {
    if (!isCalendarAvailable()) {
        console.log('Calendar not available on this platform');
        return null;
    }
    
    const hasPermission = await hasCalendarWritePermission();
    if (!hasPermission) {
        console.log('No calendar write permission');
        return null;
    }
    
    const Calendar = await getCalendarPlugin();
    if (!Calendar) {
        return null;
    }
    
    try {
        const settings = getCalendarSettings();
        const alertMinutes = options?.alertMinutesBefore ?? settings.alertMinutesBefore;
        const isRecurring = options?.isRecurring ?? settings.useRecurringEvents;
        const customTimes = options?.customTimes ?? settings.customTimes;
        
        const startTimestamp = getTimestampForTimeOfDay(startDate, supplement.defaultTime, customTimes);
        const endTimestamp = startTimestamp + 15 * 60 * 1000; // 15 Minuten Dauer
        
        // Event-Titel mit Emoji und Dosierung
        const title = supplement.dosage 
            ? `💊 ${supplement.name} (${supplement.dosage})`
            : `💊 ${supplement.name}`;
        
        // Event erstellen
        // Note: alertOffsetInMinutes wird in v8+ separat via Calendar.createEventWithPrompt gesetzt
        const { id: eventId } = await Calendar.createEvent({
            title,
            startDate: startTimestamp,
            endDate: endTimestamp,
            isAllDay: false,
        });
        
        if (eventId) {
            // Event-ID speichern
            saveEventMapping(supplement.id, eventId);
            return eventId;
        }
        
        return null;
    } catch (error) {
        console.error('Error creating calendar event:', error);
        return null;
    }
}

/**
 * Erstellt Events mit nativer UI-Bestätigung
 */
export async function createSupplementEventWithPrompt(
    supplement: SupplementForCalendar,
    startDate: Date,
    customTimes?: Record<TimeOfDay, CalendarTimeSlot>
): Promise<string[] | null> {
    if (!isCalendarAvailable()) {
        return null;
    }
    
    const Calendar = await getCalendarPlugin();
    if (!Calendar) {
        return null;
    }
    
    try {
        const settings = getCalendarSettings();
        const times = customTimes ?? settings.customTimes;
        
        const startTimestamp = getTimestampForTimeOfDay(startDate, supplement.defaultTime, times);
        const endTimestamp = startTimestamp + 15 * 60 * 1000;
        
        const title = supplement.dosage 
            ? `💊 ${supplement.name} (${supplement.dosage})`
            : `💊 ${supplement.name}`;
        
        const { id } = await Calendar.createEventWithPrompt({
            title,
            startDate: startTimestamp,
            endDate: endTimestamp,
        });
        
        if (id) {
            saveEventMapping(supplement.id, id);
            return [id];
        }
        
        return null;
    } catch (error) {
        console.error('Error creating calendar event with prompt:', error);
        return null;
    }
}

/**
 * Löscht einen Kalender-Event für ein Supplement
 */
export async function removeSupplementCalendarEvent(supplementId: string): Promise<boolean> {
    if (!isCalendarAvailable()) {
        return false;
    }
    
    const Calendar = await getCalendarPlugin();
    if (!Calendar) {
        return false;
    }
    
    const state = getCalendarSyncState();
    const eventId = state.eventIds[supplementId];
    
    if (!eventId) {
        return true; // Kein Event vorhanden
    }
    
    try {
        await Calendar.deleteEventsById({ ids: [eventId] });
        removeEventMapping(supplementId);
        return true;
    } catch (error) {
        console.error('Error deleting calendar event:', error);
        // Event-Mapping trotzdem entfernen falls Event nicht existiert
        removeEventMapping(supplementId);
        return false;
    }
}

/**
 * Synchronisiert alle Supplements zum Kalender
 */
export async function syncAllSupplementsToCalendar(
    supplements: SupplementForCalendar[]
): Promise<{ success: number; failed: number }> {
    if (!isCalendarAvailable()) {
        return { success: 0, failed: supplements.length };
    }
    
    // Erst Permissions prüfen/anfordern
    let hasPermission = await hasCalendarWritePermission();
    if (!hasPermission) {
        hasPermission = await requestAllCalendarPermissions();
        if (!hasPermission) {
            return { success: 0, failed: supplements.length };
        }
    }
    
    const settings = getCalendarSettings();
    const state = getCalendarSyncState();
    const startDate = new Date();
    
    let success = 0;
    let failed = 0;
    
    for (const supplement of supplements) {
        // Überspringe bereits synchronisierte
        if (state.eventIds[supplement.id]) {
            success++;
            continue;
        }
        
        const eventId = await createSupplementCalendarEvent(supplement, startDate, {
            alertMinutesBefore: settings.alertMinutesBefore,
            isRecurring: settings.useRecurringEvents,
            customTimes: settings.customTimes,
        });
        
        if (eventId) {
            success++;
        } else {
            failed++;
        }
    }
    
    // Settings auf enabled setzen
    saveCalendarSettings({ enabled: true });
    
    return { success, failed };
}

/**
 * Entfernt alle synchronisierten Kalender-Events
 */
export async function removeAllCalendarEvents(): Promise<boolean> {
    const state = getCalendarSyncState();
    
    for (const supplementId of state.syncedSupplementIds) {
        await removeSupplementCalendarEvent(supplementId);
    }
    
    // Settings auf disabled setzen
    saveCalendarSettings({ enabled: false });
    
    return true;
}

/**
 * Prüft ob ein Supplement im Kalender synchronisiert ist
 */
export function isSupplementSynced(supplementId: string): boolean {
    const state = getCalendarSyncState();
    return !!state.eventIds[supplementId];
}

// ============================================
// iOS REMINDERS (Optional, zusätzlich zu Events)
// ============================================

/**
 * Erstellt einen iOS Reminder für ein Supplement (nur iOS)
 */
export async function createSupplementReminder(
    supplement: SupplementForCalendar,
    dueDate: Date,
    customTimes?: Record<TimeOfDay, CalendarTimeSlot>
): Promise<string | null> {
    if (Capacitor.getPlatform() !== 'ios') {
        return null;
    }
    
    const Calendar = await getCalendarPlugin();
    if (!Calendar) {
        return null;
    }
    
    try {
        const settings = getCalendarSettings();
        const times = customTimes ?? settings.customTimes;
        const timestamp = getTimestampForTimeOfDay(dueDate, supplement.defaultTime, times);
        
        const title = supplement.dosage 
            ? `💊 ${supplement.name} (${supplement.dosage})`
            : `💊 ${supplement.name}`;
        
        const { id } = await Calendar.createReminder({
            title,
            dueDate: timestamp,
        });
        
        return id || null;
    } catch (error) {
        console.error('Error creating reminder:', error);
        return null;
    }
}

// Re-exports für einfachen Zugriff
export { 
    isCalendarAvailable,
    hasCalendarWritePermission,
    requestAllCalendarPermissions,
    checkCalendarPermissions,
} from './calendarPermissions';

export type { 
    CalendarSettings, 
    CalendarSyncState,
    CalendarTimeSlot,
    CalendarPermissionStatus,
} from './types';

export { DEFAULT_CALENDAR_SETTINGS, DEFAULT_CALENDAR_TIMES } from './types';
