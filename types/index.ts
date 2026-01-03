
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
