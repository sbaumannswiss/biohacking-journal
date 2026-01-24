import { TimeOfDay } from '@/types';

// ============================================
// CALENDAR TYPES
// ============================================

export interface CalendarTimeSlot {
    hour: number;
    minute: number;
}

export interface CalendarSettings {
    enabled: boolean;
    alertMinutesBefore: number;  // Default: 15
    customTimes: Record<TimeOfDay, CalendarTimeSlot>;
    useRecurringEvents: boolean;  // Daily recurring vs. individual events
}

export interface CalendarSyncState {
    lastSyncAt: string | null;
    syncedSupplementIds: string[];
    eventIds: Record<string, string>;  // supplementId -> calendarEventId
}

export interface CalendarPermissionStatus {
    readCalendar: 'granted' | 'denied' | 'prompt';
    writeCalendar: 'granted' | 'denied' | 'prompt';
    readReminders?: 'granted' | 'denied' | 'prompt';  // iOS only
    writeReminders?: 'granted' | 'denied' | 'prompt';  // iOS only
}

export interface CreateCalendarEventOptions {
    title: string;
    startDate: number;  // Unix timestamp in milliseconds
    endDate?: number;
    location?: string;
    notes?: string;
    alerts?: number[];  // Minutes before
    isRecurring?: boolean;
    calendarId?: string;
}

export interface CalendarEvent {
    id: string;
    title: string;
    startDate: number;
    endDate?: number;
    notes?: string;
}

// Default times for each time of day slot
export const DEFAULT_CALENDAR_TIMES: Record<TimeOfDay, CalendarTimeSlot> = {
    morning: { hour: 7, minute: 0 },
    noon: { hour: 12, minute: 0 },
    evening: { hour: 18, minute: 0 },
    bedtime: { hour: 22, minute: 0 },
};

export const DEFAULT_CALENDAR_SETTINGS: CalendarSettings = {
    enabled: false,
    alertMinutesBefore: 15,
    customTimes: DEFAULT_CALENDAR_TIMES,
    useRecurringEvents: true,
};
