
export type Profile = {
    id: string
    username: string | null
    avatar_url: string | null
    xp: number
    current_streak: number
    last_check_in: string | null // ISO timestamp
}

export type Supplement = {
    id: string
    user_id: string
    name: string
    dosage: string
    default_time: 'morning' | 'noon' | 'evening' | 'bedtime'
    icon?: string
}

export type IntakeLog = {
    id: string
    user_id: string
    supplement_id: string
    taken_at: string // ISO timestamp, precision is key
    synced: boolean
}

export type DailyMetric = {
    id: string
    user_id: string
    date: string
    sleep_quality: number
    energy_level: number
    focus_score: number
    notes: string | null
}

export type TimeOfDay = 'morning' | 'noon' | 'evening' | 'bedtime'

// ============================================
// WORKOUT TYPES
// ============================================

export type WorkoutPhase = 'rest' | 'pre' | 'intra' | 'post'

export type WorkoutType = 
    | 'strength' 
    | 'cardio' 
    | 'hiit' 
    | 'yoga' 
    | 'running' 
    | 'cycling' 
    | 'swimming' 
    | 'other'

export type WorkoutSource = 'garmin' | 'healthconnect' | 'apple_health' | 'manual'

export interface ScheduledWorkout {
    id: string
    userId: string
    plannedTime: string  // ISO timestamp
    type: WorkoutType
    estimatedDuration: number  // minutes
    confirmed: boolean
    phase: WorkoutPhase
}

export interface DetectedWorkout {
    id: string
    userId: string
    startTime: string  // ISO timestamp
    endTime: string
    type: WorkoutType
    durationMinutes: number
    caloriesBurned?: number
    avgHeartRate?: number
    source: WorkoutSource
}

export interface WorkoutSupplementTiming {
    phase: WorkoutPhase[]  // Which phases this supplement is relevant for
    minutesBefore?: number  // For pre-workout: how many minutes before
    minutesAfter?: number   // For post-workout: how many minutes after
    reason: string          // Why this timing is optimal
}

export interface ActiveWorkout {
    id: string
    type: WorkoutType
    startTime: string  // ISO timestamp
    estimatedDuration: number
    phase: WorkoutPhase
}

// ============================================
// CALENDAR TYPES
// ============================================

export interface CalendarTimeConfig {
    hour: number
    minute: number
}

export interface CalendarSettingsDB {
    id: string
    user_id: string
    enabled: boolean
    alert_minutes: number
    custom_times: Record<TimeOfDay, CalendarTimeConfig>
    created_at: string
    updated_at: string
}

export interface SupplementCalendarSync {
    supplementId: string
    calendarEventId: string
    syncedAt: string
}
