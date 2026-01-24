// Calendar Integration Module
// Ermöglicht Kalender-Synchronisation für Supplement-Erinnerungen

export {
    // Settings
    getCalendarSettings,
    saveCalendarSettings,
    updateCustomTime,
    
    // Sync State
    getCalendarSyncState,
    isSupplementSynced,
    
    // Event Operations
    createSupplementCalendarEvent,
    createSupplementEventWithPrompt,
    removeSupplementCalendarEvent,
    syncAllSupplementsToCalendar,
    removeAllCalendarEvents,
    
    // iOS Reminders
    createSupplementReminder,
    
    // Permissions
    isCalendarAvailable,
    hasCalendarWritePermission,
    requestAllCalendarPermissions,
    checkCalendarPermissions,
    
    // Types & Constants
    DEFAULT_CALENDAR_SETTINGS,
    DEFAULT_CALENDAR_TIMES,
} from './calendarService';

export type {
    CalendarSettings,
    CalendarSyncState,
    CalendarTimeSlot,
    CalendarPermissionStatus,
} from './types';
