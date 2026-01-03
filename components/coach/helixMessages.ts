// Helix Coach Nachrichten-System
// Wissenschaftlich fundiert mit Humor - Mix aus Huberman und Duolingo

export type HelixTrigger = 
    | 'welcome'
    | 'morningGreeting'
    | 'noonGreeting'
    | 'eveningGreeting'
    | 'bedtimeGreeting'
    | 'checkIn'
    | 'supplementAdded'
    | 'supplementRemoved'
    | 'streakMilestone'
    | 'levelUp'
    | 'questCompleted'
    | 'questUnlocked'
    | 'inactivity'
    | 'emptyStack'
    | 'error'
    | 'firstCheckIn'
    | 'allDone'
    | 'journalComplete'
    // Page-specific triggers
    | 'journalWelcome'
    | 'journalEdit'
    | 'libraryWelcome'
    | 'libraryBrowsing'
    | 'libraryScan'
    | 'statsWelcome'
    | 'statsGoodProgress'
    | 'statsBadProgress'
    | 'profileWelcome'
    | 'onboardingWelcome'
    | 'onboardingGoalSelected'
    | 'onboardingComplete'
    | 'streakCelebration';

export interface HelixMessageData {
    message: string;
    mood: 'idle' | 'happy' | 'excited' | 'thinking' | 'sad';
    emoji?: string;
}

// Nachrichten mit Platzhaltern: {name}, {xp}, {streak}, {level}, {supplement}
const MESSAGES: Record<HelixTrigger, string[]> = {
    welcome: [
        "Hey! Ich bin Helix, dein Bio-Coach. Zusammen optimieren wir deine Zellgesundheit.",
        "Willkommen zurück, Biohacker! Bereit für die heutige Dosis Optimierung?",
    ],
    
    morningGreeting: [
        "Guten Morgen! Cortisol-Peak erkannt. Perfekter Zeitpunkt für Sonnenlicht und Protein.",
        "Rise and shine! Deine Adenosin-Rezeptoren sind gerade aufnahmefähig. Kaffee kann warten, Sonnenlicht nicht!",
        "Morgen! Fun Fact: Die ersten 30 Minuten nach dem Aufwachen sind entscheidend für deinen Tagesrhythmus.",
    ],
    
    noonGreeting: [
        "Mittagszeit! Dein Verdauungsfeuer brennt am stärksten. Perfekt für die Hauptmahlzeit.",
        "High Noon! Deine Körpertemperatur ist jetzt am höchsten - optimale Zeit für anspruchsvolle Aufgaben.",
    ],
    
    eveningGreeting: [
        "Abendmodus aktiviert! Zeit, das Nervensystem runterzufahren. Weniger Blaulicht, mehr Entspannung.",
        "Der Abend naht. Dein Körper beginnt, Melatonin-Vorläufer zu produzieren. Unterstütze ihn!",
    ],
    
    bedtimeGreeting: [
        "Schlafenszeit naht! Die nächsten 8 Stunden sind dein größtes Biohack-Tool. Nutze sie weise.",
        "Glymphatic System incoming! Im Schlaf reinigt dein Gehirn 60% mehr Toxine. Gönn dir das!",
    ],
    
    checkIn: [
        "{supplement} geloggt! Dein zukünftiges Ich dankt dir.",
        "Check! {supplement} ist drin. Konsistenz schlägt Perfektion, immer.",
        "{supplement} eingetragen. Fun Fact: Es dauert ~66 Tage, bis eine Gewohnheit automatisch wird.",
        "{supplement} eingecheckt. Deine Mitochondrien applaudieren gerade.",
    ],
    
    supplementAdded: [
        "{supplement} im Stack! Deine Enzyme werden sich freuen.",
        "Neues Element freigeschaltet: {supplement}! Gute Wahl.",
        "{supplement} hinzugefügt! Qualitätsentscheidung. Die Dosis macht das Gift - und den Benefit.",
    ],
    
    supplementRemoved: [
        "{supplement} entfernt. Manchmal ist weniger mehr. Respekt für die bewusste Entscheidung.",
        "Stack optimiert! {supplement} raus. Periodisierung ist auch bei Supplements sinnvoll.",
    ],
    
    streakMilestone: [
        "{streak} Tage Streak! Deine Mitochondrien feiern gerade eine kleine ATP-Party.",
        "Wahnsinn! {streak} Tage in Folge. Deine Genexpression optimiert sich messbar.",
        "{streak}-Tage-Streak! Das ist kein Zufall mehr, das ist Identität. Du BIST ein Biohacker.",
    ],
    
    levelUp: [
        "LEVEL UP! Du bist jetzt Level {level}! Neue Quests freigeschaltet.",
        "Level {level} erreicht! Deine zelluläre Kompetenz steigt. Weiter so!",
    ],
    
    questCompleted: [
        "Quest abgeschlossen! +{xp} XP. Dein Dopamin-System feiert - aber nachhaltig.",
        "Mission Complete! Du hast bewiesen, dass du es ernst meinst.",
    ],
    
    questUnlocked: [
        "Neue Quest verfügbar! Dein Dopamin-System freut sich schon auf die Belohnung.",
        "Quest freigeschaltet! Bereit für die nächste Herausforderung?",
    ],
    
    inactivity: [
        "Hey, ich drehe mich hier alleine... Dein Stack wartet auf den täglichen Check-in.",
        "Kleine Erinnerung: Konsistenz > Perfektion. Dein Stack wartet.",
        "Deine Supplements warten. Ein kleiner Check-in für große Wirkung?",
    ],
    
    emptyStack: [
        "Dein Stack ist noch leer! Zeit, das Bio-Lab zu erkunden.",
        "Keine Supplements im Stack? Lass uns das ändern! Das Bio-Lab wartet.",
    ],
    
    error: [
        "Das hat nicht geklappt. Keine Sorge - auch DNA macht mal Replikationsfehler.",
        "Kleiner Fehler im System. Selbst Mitochondrien brauchen manchmal einen Neustart.",
    ],
    
    firstCheckIn: [
        "Dein erster Check-in! Die Reise beginnt. Jeder Experte war mal ein Anfänger.",
        "Erster Check-in im Buch! Du hast gerade den wichtigsten Schritt gemacht: Anfangen.",
    ],
    
    allDone: [
        "Alles erledigt für heute! Zeit, die Früchte zu genießen. Dein Körper dankt dir.",
        "Stack completed! Du hast heute alles gegeben. Rest ist jetzt der beste Biohack.",
    ],
    
    journalComplete: [
        "Journal geloggt! Selbstreflexion ist der Schlüssel zur Optimierung.",
        "Perfekt! Dein täglicher Log hilft mir, Muster zu erkennen.",
        "Journal-Eintrag gespeichert! Konsistenz beim Tracking bringt bessere Insights.",
        "Dein Bio-Logbuch wächst. Je mehr Daten, desto smarter werden meine Empfehlungen.",
    ],
    
    // === PAGE-SPECIFIC MESSAGES ===
    
    journalWelcome: [
        "Zeit für Selbstreflexion! Wie war dein Tag gestern?",
        "Dein täglicher Check-in macht den Unterschied. Los geht's!",
        "Jeder Datenpunkt bringt uns näher zu deinem optimalen Protokoll.",
    ],
    
    journalEdit: [
        "Gute Idee, die Daten zu aktualisieren. Präzision ist wichtig!",
        "Nachbessern ist völlig okay – bessere Daten = bessere Insights.",
    ],
    
    libraryWelcome: [
        "Willkommen im BioLab! Hier findest du evidenzbasierte Supplements.",
        "Swipe durch die Sammlung – jedes Supplement mit Evidenz-Level!",
        "Das BioLab wartet auf dich. Welches Molekül darf es heute sein?",
    ],
    
    libraryBrowsing: [
        "Interessante Wahl! Schau dir die Evidenz und optimale Dosierung an.",
        "Jedes Supplement hat seine Stärken. Finde das Passende für deine Ziele!",
    ],
    
    libraryScan: [
        "Kamera bereit! Zeig mir dein Supplement-Label.",
        "Ich analysiere die Inhaltsstoffe für dich. Hold still!",
    ],
    
    statsWelcome: [
        "Deine Bio-Daten auf einen Blick. Lass uns Muster entdecken!",
        "Statistiken sind der Spiegel deiner Optimierung. Was siehst du?",
    ],
    
    statsGoodProgress: [
        "Starke Entwicklung! Deine Kurven zeigen nach oben. Weiter so!",
        "Die Daten sprechen für sich – du machst echte Fortschritte!",
        "Beeindruckend! Dein Körper dankt dir für die Konsistenz.",
    ],
    
    statsBadProgress: [
        "Kleine Delle in den Daten? Kein Problem – jeder Tag ist eine neue Chance.",
        "Die Kurve zeigt Optimierungspotenzial. Lass uns die Stellschrauben finden!",
    ],
    
    profileWelcome: [
        "Dein Bio-Profil! Hier siehst du deine Reise auf einen Blick.",
        "Level {level} – du hast schon einiges erreicht!",
    ],
    
    onboardingWelcome: [
        "Hey! Ich bin Helix, dein persönlicher Bio-Coach. Lass uns starten!",
        "Willkommen! Zusammen optimieren wir deine Zellgesundheit. Bereit?",
    ],
    
    onboardingGoalSelected: [
        "Gute Wahl! Ich werde meine Empfehlungen darauf abstimmen.",
        "Perfekt! Dein Ziel ist jetzt mein Fokus.",
    ],
    
    onboardingComplete: [
        "Setup abgeschlossen! Dein personalisiertes Dashboard wartet.",
        "Bereit für die Optimierung! Lass uns deine erste Quest starten.",
    ],
    
    streakCelebration: [
        "{streak} Tage Streak! Das ist echte Dedication. Deine Zellen feiern!",
        "Wow, {streak} Tage am Stück! Du definierst neu, was möglich ist.",
        "{streak}-Tage-Streak! Die Wissenschaft zeigt: Konsistenz schlägt Intensität.",
    ],
};

// Mood-Mapping basierend auf Trigger
const MOOD_MAP: Record<HelixTrigger, HelixMessageData['mood']> = {
    welcome: 'happy',
    morningGreeting: 'happy',
    noonGreeting: 'happy',
    eveningGreeting: 'thinking',
    bedtimeGreeting: 'thinking',
    checkIn: 'happy',
    supplementAdded: 'excited',
    supplementRemoved: 'thinking',
    streakMilestone: 'excited',
    levelUp: 'excited',
    questCompleted: 'excited',
    questUnlocked: 'happy',
    inactivity: 'sad',
    emptyStack: 'thinking',
    error: 'sad',
    firstCheckIn: 'excited',
    allDone: 'happy',
    journalComplete: 'excited',
    // Page-specific moods
    journalWelcome: 'happy',
    journalEdit: 'thinking',
    libraryWelcome: 'excited',
    libraryBrowsing: 'happy',
    libraryScan: 'thinking',
    statsWelcome: 'thinking',
    statsGoodProgress: 'excited',
    statsBadProgress: 'thinking',
    profileWelcome: 'happy',
    onboardingWelcome: 'excited',
    onboardingGoalSelected: 'happy',
    onboardingComplete: 'excited',
    streakCelebration: 'excited',
};

// Emoji-Mapping (deprecated - nicht mehr in UI verwendet)
const EMOJI_MAP: Record<HelixMessageData['mood'], string> = {
    idle: '',
    happy: '',
    excited: '',
    thinking: '',
    sad: '',
};

/**
 * Holt eine zufällige Nachricht für einen bestimmten Trigger
 */
export function getHelixMessage(
    trigger: HelixTrigger, 
    context?: Record<string, string | number>
): HelixMessageData {
    const messages = MESSAGES[trigger];
    const randomIndex = Math.floor(Math.random() * messages.length);
    let message = messages[randomIndex];
    
    // Platzhalter ersetzen
    if (context) {
        Object.entries(context).forEach(([key, value]) => {
            message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
        });
    }
    
    const mood = MOOD_MAP[trigger];
    
    return {
        message,
        mood,
        emoji: EMOJI_MAP[mood],
    };
}

/**
 * Bestimmt den passenden Greeting-Trigger basierend auf Tageszeit
 */
export function getTimeBasedGreeting(timeOfDay: string): HelixTrigger {
    switch (timeOfDay) {
        case 'morning': return 'morningGreeting';
        case 'noon': return 'noonGreeting';
        case 'evening': return 'eveningGreeting';
        case 'bedtime': return 'bedtimeGreeting';
        default: return 'morningGreeting';
    }
}

