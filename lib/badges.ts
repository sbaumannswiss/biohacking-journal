// Badge-Definitionen und Logik

export interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string; // Emoji
    category: 'streak' | 'milestone' | 'consistency' | 'special' | 'quest';
    requirement: number;
    unlocked: boolean;
    progress: number; // 0-100
    unlockedAt?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | 'Beast'; // Für Quest-Badges
}

// Badge-Vorlagen
export const BADGE_TEMPLATES: Omit<Badge, 'unlocked' | 'progress' | 'unlockedAt'>[] = [
    // Streak Badges
    {
        id: 'streak-3',
        name: '3-Tage Streak',
        description: '3 Tage in Folge Supplements genommen',
        icon: '🔥',
        category: 'streak',
        requirement: 3,
    },
    {
        id: 'streak-7',
        name: 'Woche geschafft',
        description: '7 Tage in Folge Supplements genommen',
        icon: '⚡',
        category: 'streak',
        requirement: 7,
    },
    {
        id: 'streak-14',
        name: 'Zwei Wochen stark',
        description: '14 Tage in Folge Supplements genommen',
        icon: '💪',
        category: 'streak',
        requirement: 14,
    },
    {
        id: 'streak-30',
        name: 'Monats-Master',
        description: '30 Tage in Folge Supplements genommen',
        icon: '🏆',
        category: 'streak',
        requirement: 30,
    },
    {
        id: 'streak-100',
        name: 'Centurion',
        description: '100 Tage in Folge Supplements genommen',
        icon: '👑',
        category: 'streak',
        requirement: 100,
    },
    
    // Milestone Badges
    {
        id: 'first-checkin',
        name: 'Erster Check-in',
        description: 'Dein erstes Supplement eingecheckt',
        icon: '🌱',
        category: 'milestone',
        requirement: 1,
    },
    {
        id: 'checkins-10',
        name: '10 Check-ins',
        description: '10 Supplements eingecheckt',
        icon: '🎯',
        category: 'milestone',
        requirement: 10,
    },
    {
        id: 'checkins-50',
        name: '50 Check-ins',
        description: '50 Supplements eingecheckt',
        icon: '🚀',
        category: 'milestone',
        requirement: 50,
    },
    {
        id: 'checkins-100',
        name: '100 Check-ins',
        description: '100 Supplements eingecheckt',
        icon: '💯',
        category: 'milestone',
        requirement: 100,
    },
    {
        id: 'checkins-500',
        name: 'Supplement-Veteran',
        description: '500 Supplements eingecheckt',
        icon: '🎖️',
        category: 'milestone',
        requirement: 500,
    },
    
    // Consistency Badges
    {
        id: 'adherence-80',
        name: '80% Adherence',
        description: '80% Adherence in einem Monat erreicht',
        icon: '📊',
        category: 'consistency',
        requirement: 80,
    },
    {
        id: 'adherence-95',
        name: 'Fast Perfekt',
        description: '95% Adherence in einem Monat erreicht',
        icon: '⭐',
        category: 'consistency',
        requirement: 95,
    },
    {
        id: 'adherence-100',
        name: 'Perfektionist',
        description: '100% Adherence in einem Monat erreicht',
        icon: '💎',
        category: 'consistency',
        requirement: 100,
    },
    
    // Special Badges
    {
        id: 'stack-5',
        name: 'Stack Builder',
        description: '5 verschiedene Supplements im Stack',
        icon: '🧪',
        category: 'special',
        requirement: 5,
    },
    {
        id: 'stack-10',
        name: 'Bio-Hacker',
        description: '10 verschiedene Supplements im Stack',
        icon: '🔬',
        category: 'special',
        requirement: 10,
    },
    {
        id: 'journal-7',
        name: 'Journal-Starter',
        description: '7 Tage Journal-Einträge',
        icon: '📝',
        category: 'special',
        requirement: 7,
    },
    
    // Quest Badges
    {
        id: 'quest-first',
        name: 'Quest-Starter',
        description: 'Erste Quest abgeschlossen',
        icon: '🎯',
        category: 'quest',
        requirement: 1,
    },
    {
        id: 'quest-5',
        name: 'Quest-Hunter',
        description: '5 Quests abgeschlossen',
        icon: '🏹',
        category: 'quest',
        requirement: 5,
    },
    {
        id: 'quest-10',
        name: 'Quest-Warrior',
        description: '10 Quests abgeschlossen',
        icon: '⚔️',
        category: 'quest',
        requirement: 10,
    },
    {
        id: 'quest-25',
        name: 'Quest-Champion',
        description: '25 Quests abgeschlossen',
        icon: '🛡️',
        category: 'quest',
        requirement: 25,
    },
    
    // Difficulty Quest Badges
    {
        id: 'quest-intermediate',
        name: 'Intermediate Achiever',
        description: 'Eine Intermediate Quest geschafft',
        icon: '⚡',
        category: 'quest',
        requirement: 1,
        difficulty: 'Intermediate',
    },
    {
        id: 'quest-advanced',
        name: 'Advanced Warrior',
        description: 'Eine Advanced Quest geschafft',
        icon: '🔥',
        category: 'quest',
        requirement: 1,
        difficulty: 'Advanced',
    },
    {
        id: 'quest-beast',
        name: 'Beast Mode Unlocked',
        description: 'Eine Beast Mode Quest überlebt',
        icon: '💀',
        category: 'quest',
        requirement: 1,
        difficulty: 'Beast',
    },
    {
        id: 'quest-beast-3',
        name: 'Apex Predator',
        description: '3 Beast Mode Quests abgeschlossen',
        icon: '🐺',
        category: 'quest',
        requirement: 3,
        difficulty: 'Beast',
    },
    
    // Spezielle Quest Badges
    {
        id: 'quest-ice-bath',
        name: 'Arctic Explorer',
        description: 'The Arctic Protocol Quest abgeschlossen',
        icon: '🧊',
        category: 'quest',
        requirement: 1,
    },
    {
        id: 'quest-dopamine-detox',
        name: 'Mind Master',
        description: 'Dopamine Detox Quest abgeschlossen',
        icon: '🧠',
        category: 'quest',
        requirement: 1,
    },
    {
        id: 'quest-extended-fast',
        name: 'Fasting Legend',
        description: 'Autophagy Reset (36h Fast) abgeschlossen',
        icon: '🍃',
        category: 'quest',
        requirement: 1,
    },
    {
        id: 'quest-norse-god',
        name: 'Norse God',
        description: 'Norse God Quest abgeschlossen',
        icon: '⚡',
        category: 'quest',
        requirement: 1,
    },
];

// Quest-Stats Interface
export interface QuestStats {
    totalCompleted: number;
    beginnerCompleted: number;
    intermediateCompleted: number;
    advancedCompleted: number;
    beastCompleted: number;
    completedQuestIds: string[]; // IDs der abgeschlossenen Quests
}

// Berechnet alle Badges basierend auf User-Stats
export function calculateBadges(stats: {
    currentStreak: number;
    longestStreak: number;
    totalCheckIns: number;
    adherencePercent: number;
    stackSize: number;
    journalDays: number;
    quests?: QuestStats;
}): Badge[] {
    const questStats = stats.quests || {
        totalCompleted: 0,
        beginnerCompleted: 0,
        intermediateCompleted: 0,
        advancedCompleted: 0,
        beastCompleted: 0,
        completedQuestIds: [],
    };

    return BADGE_TEMPLATES.map(template => {
        let progress = 0;
        let unlocked = false;
        
        switch (template.category) {
            case 'streak':
                progress = Math.min(100, (stats.longestStreak / template.requirement) * 100);
                unlocked = stats.longestStreak >= template.requirement;
                break;
                
            case 'milestone':
                progress = Math.min(100, (stats.totalCheckIns / template.requirement) * 100);
                unlocked = stats.totalCheckIns >= template.requirement;
                break;
                
            case 'consistency':
                progress = Math.min(100, (stats.adherencePercent / template.requirement) * 100);
                unlocked = stats.adherencePercent >= template.requirement;
                break;
                
            case 'special':
                if (template.id.startsWith('stack-')) {
                    progress = Math.min(100, (stats.stackSize / template.requirement) * 100);
                    unlocked = stats.stackSize >= template.requirement;
                } else if (template.id.startsWith('journal-')) {
                    progress = Math.min(100, (stats.journalDays / template.requirement) * 100);
                    unlocked = stats.journalDays >= template.requirement;
                }
                break;
                
            case 'quest':
                // Spezielle Quest-Badges (für einzelne schwere Quests)
                if (template.id === 'quest-ice-bath') {
                    unlocked = questStats.completedQuestIds.includes('ice-bath');
                    progress = unlocked ? 100 : 0;
                } else if (template.id === 'quest-dopamine-detox') {
                    unlocked = questStats.completedQuestIds.includes('monk-mode');
                    progress = unlocked ? 100 : 0;
                } else if (template.id === 'quest-extended-fast') {
                    unlocked = questStats.completedQuestIds.includes('extended-fast');
                    progress = unlocked ? 100 : 0;
                } else if (template.id === 'quest-norse-god') {
                    unlocked = questStats.completedQuestIds.includes('norse-god');
                    progress = unlocked ? 100 : 0;
                }
                // Difficulty-basierte Badges
                else if (template.difficulty === 'Intermediate') {
                    progress = Math.min(100, (questStats.intermediateCompleted / template.requirement) * 100);
                    unlocked = questStats.intermediateCompleted >= template.requirement;
                } else if (template.difficulty === 'Advanced') {
                    progress = Math.min(100, (questStats.advancedCompleted / template.requirement) * 100);
                    unlocked = questStats.advancedCompleted >= template.requirement;
                } else if (template.difficulty === 'Beast') {
                    progress = Math.min(100, (questStats.beastCompleted / template.requirement) * 100);
                    unlocked = questStats.beastCompleted >= template.requirement;
                }
                // Allgemeine Quest-Count Badges
                else {
                    progress = Math.min(100, (questStats.totalCompleted / template.requirement) * 100);
                    unlocked = questStats.totalCompleted >= template.requirement;
                }
                break;
        }
        
        return {
            ...template,
            progress: Math.round(progress),
            unlocked,
        };
    });
}

// Holt nur freigeschaltete Badges
export function getUnlockedBadges(badges: Badge[]): Badge[] {
    return badges.filter(b => b.unlocked);
}

// Holt Badges mit Progress > 0 aber nicht freigeschaltet
export function getInProgressBadges(badges: Badge[]): Badge[] {
    return badges.filter(b => !b.unlocked && b.progress > 0).sort((a, b) => b.progress - a.progress);
}

