import { Capacitor } from '@capacitor/core';
import type { CalendarPermissionStatus } from './types';

/**
 * Prüft ob das Calendar-Plugin verfügbar ist (nur native Plattformen)
 */
export function isCalendarAvailable(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Dynamischer Import des Calendar-Plugins
 * Verhindert Fehler auf Web-Plattform
 */
async function getCalendarPlugin() {
    if (!isCalendarAvailable()) {
        return null;
    }
    
    try {
        const { CapacitorCalendar } = await import('@ebarooni/capacitor-calendar');
        return CapacitorCalendar;
    } catch (error) {
        console.error('Calendar plugin not available:', error);
        return null;
    }
}

/**
 * Prüft den aktuellen Permission-Status für Kalender-Zugriff
 */
export async function checkCalendarPermissions(): Promise<CalendarPermissionStatus> {
    const Calendar = await getCalendarPlugin();
    
    if (!Calendar) {
        return {
            readCalendar: 'denied',
            writeCalendar: 'denied',
        };
    }
    
    try {
        const { result } = await Calendar.checkAllPermissions();
        
        // Das Plugin gibt ein result-Objekt mit den Permission-Status zurück
        const permResult = result as Record<string, string>;
        
        return {
            readCalendar: (permResult.readCalendar as 'granted' | 'denied' | 'prompt') || 'prompt',
            writeCalendar: (permResult.writeCalendar as 'granted' | 'denied' | 'prompt') || 'prompt',
            readReminders: permResult.readReminders as 'granted' | 'denied' | 'prompt' | undefined,
            writeReminders: permResult.writeReminders as 'granted' | 'denied' | 'prompt' | undefined,
        };
    } catch (error) {
        console.error('Error checking calendar permissions:', error);
        return {
            readCalendar: 'denied',
            writeCalendar: 'denied',
        };
    }
}

/**
 * Fordert Kalender-Schreibrechte an
 * Gibt true zurück wenn erfolgreich
 */
export async function requestCalendarWritePermission(): Promise<boolean> {
    const Calendar = await getCalendarPlugin();
    
    if (!Calendar) {
        return false;
    }
    
    try {
        const result = await Calendar.requestWriteOnlyCalendarAccess();
        return result.result === 'granted';
    } catch (error) {
        console.error('Error requesting calendar permission:', error);
        return false;
    }
}

/**
 * Fordert alle benötigten Kalender-Rechte an
 */
export async function requestAllCalendarPermissions(): Promise<boolean> {
    const Calendar = await getCalendarPlugin();
    
    if (!Calendar) {
        return false;
    }
    
    try {
        // Erst Write-Zugriff
        const writeResult = await Calendar.requestWriteOnlyCalendarAccess();
        if (writeResult.result !== 'granted') {
            return false;
        }
        
        // Auf iOS auch Reminders anfordern (optional, für native Reminders)
        if (Capacitor.getPlatform() === 'ios') {
            try {
                await Calendar.requestFullRemindersAccess();
            } catch {
                // Reminders sind optional, ignoriere Fehler
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error requesting calendar permissions:', error);
        return false;
    }
}

/**
 * Prüft ob Kalender-Schreibrechte vorhanden sind
 */
export async function hasCalendarWritePermission(): Promise<boolean> {
    const status = await checkCalendarPermissions();
    return status.writeCalendar === 'granted';
}

export { getCalendarPlugin };
