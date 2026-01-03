export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Beast';
export type Category = 'Mind' | 'Body' | 'Sleep' | 'Nutrition' | 'Recovery';

export interface Quest {
    id: string;
    title: string;
    description: string;
    xp: number;
    minLevel: number;
    difficulty: Difficulty;
    category: Category;
    duration?: string; // e.g. "5 mins", "7 days"
}

export const QUESTS: Quest[] = [
    // LEVEL 1: FUNDAMENTALS (Starter)
    {
        id: 'hydration-hero',
        title: 'Hydration Hero',
        description: 'Drink 500ml of water with electrolytes immediately upon waking.',
        xp: 50,
        minLevel: 1,
        difficulty: 'Beginner',
        category: 'Nutrition',
        duration: 'Daily'
    },
    {
        id: 'morning-light',
        title: 'Solar Charger',
        description: 'View natural sunlight for 10 minutes within 1 hour of waking.',
        xp: 75,
        minLevel: 1,
        difficulty: 'Beginner',
        category: 'Sleep',
        duration: '10 mins'
    },
    {
        id: 'digital-sunset',
        title: 'Digital Sunset',
        description: 'No screens (phone, laptop, TV) 1 hour before bed.',
        xp: 100,
        minLevel: 1,
        difficulty: 'Beginner',
        category: 'Sleep',
        duration: '60 mins'
    },
    {
        id: 'protein-power',
        title: 'Protein Anchor',
        description: 'Consume 30g of protein within 30 minutes of waking.',
        xp: 75,
        minLevel: 1,
        difficulty: 'Beginner',
        category: 'Nutrition',
        duration: 'Daily'
    },

    // LEVEL 3: OPTIMIZATION (Intermediate)
    {
        id: 'cold-shower',
        title: 'Arctic Rinse',
        description: 'End your shower with 30 seconds of the coldest water possible.',
        xp: 150,
        minLevel: 3,
        difficulty: 'Intermediate',
        category: 'Recovery',
        duration: '30 sec'
    },
    {
        id: 'box-breathing',
        title: 'Navy SEAL Breath',
        description: 'Perform Box Breathing (4-4-4-4) for 5 minutes to reset stress.',
        xp: 125,
        minLevel: 3,
        difficulty: 'Intermediate',
        category: 'Mind',
        duration: '5 mins'
    },
    {
        id: 'fasting-16-8',
        title: 'Metabolic Switch',
        description: 'Fast for 16 hours. Only water, black coffee, or tea allowed.',
        xp: 200,
        minLevel: 4,
        difficulty: 'Intermediate',
        category: 'Nutrition',
        duration: '16 hours'
    },
    {
        id: 'zone-2',
        title: 'Mitochondrial March',
        description: '30 minutes of Zone 2 cardio (conversational pace).',
        xp: 175,
        minLevel: 4,
        difficulty: 'Intermediate',
        category: 'Body',
        duration: '30 mins'
    },

    // LEVEL 5: PERFORMANCE (Advanced)
    {
        id: 'mouth-taping',
        title: 'Nasal Necessity',
        description: 'Sleep with mouth tape to force nasal breathing (improves NO production).',
        xp: 250,
        minLevel: 5,
        difficulty: 'Advanced',
        category: 'Sleep',
        duration: 'Nightly'
    },
    {
        id: 'ice-bath',
        title: 'The Arctic Protocol',
        description: 'Full body submersion in ice water (<10°C) for 2 minutes.',
        xp: 350,
        minLevel: 6,
        difficulty: 'Advanced',
        category: 'Recovery',
        duration: '2 mins'
    },
    {
        id: 'monk-mode',
        title: 'Dopamine Detox',
        description: '24 hours without social media, entertainment, or highly palatable food.',
        xp: 500,
        minLevel: 7,
        difficulty: 'Advanced',
        category: 'Mind',
        duration: '24 hours'
    },

    // LEVEL 10: BIOHACKER ELITE (Beast Mode)
    {
        id: 'extended-fast',
        title: 'Autophagy Reset',
        description: '36-hour water only fast to deep clean cellular waste.',
        xp: 1000,
        minLevel: 10,
        difficulty: 'Beast',
        category: 'Nutrition',
        duration: '36 hours'
    },
    {
        id: 'norse-god',
        title: 'Norse God',
        description: 'Sauna (20 min) + Ice Bath (3 min) x 3 rounds.',
        xp: 800,
        minLevel: 10,
        difficulty: 'Beast',
        category: 'Recovery',
        duration: '90 mins'
    },
    {
        id: 'dark-retreat',
        title: 'Sensory Deprivation',
        description: 'Sit in complete darkness and silence for 60 minutes.',
        xp: 600,
        minLevel: 10,
        difficulty: 'Beast',
        category: 'Mind',
        duration: '60 mins'
    }
];
