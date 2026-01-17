import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Mindestanforderungen für statistische Signifikanz
const MIN_JOURNAL_DAYS = 7;
const MIN_CHECKINS = 5;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { stats } = body;

        if (!stats) {
            return NextResponse.json(
                { error: 'Stats sind erforderlich' },
                { status: 400 }
            );
        }

        // Prüfen ob genug Daten für statistische Signifikanz vorhanden sind
        const journalDays = stats.journalDays || 0;
        const totalCheckIns = stats.totalCheckIns || 0;
        const hasEnoughData = journalDays >= MIN_JOURNAL_DAYS && totalCheckIns >= MIN_CHECKINS;

        // Wenn nicht genug Daten: Statische Nachricht ohne AI-Aufruf
        if (!hasEnoughData) {
            const daysNeeded = Math.max(0, MIN_JOURNAL_DAYS - journalDays);
            const checkInsNeeded = Math.max(0, MIN_CHECKINS - totalCheckIns);
            
            let collectingMessage = `🧬 Hey, ich bin Helix!\n\n`;
            collectingMessage += `Ich sammle gerade noch Daten, um dir wirklich aussagekräftige Insights geben zu können. `;
            collectingMessage += `Für statistisch relevante Erkenntnisse brauche ich mindestens ${MIN_JOURNAL_DAYS} Tage Tracking-Daten.\n\n`;
            
            if (daysNeeded > 0) {
                collectingMessage += `📊 Noch ${daysNeeded} Tag${daysNeeded !== 1 ? 'e' : ''} Journal-Einträge nötig\n`;
            }
            if (checkInsNeeded > 0) {
                collectingMessage += `✅ Noch ${checkInsNeeded} Check-in${checkInsNeeded !== 1 ? 's' : ''} nötig\n`;
            }
            
            collectingMessage += `\n💡 Tipp: Tracke täglich dein Wohlbefinden und deine Supplements – so kann ich bald echte Muster für dich erkennen!`;

            return NextResponse.json({ 
                summary: collectingMessage,
                isCollecting: true,
                daysNeeded,
                checkInsNeeded
            });
        }

        // Genug Daten vorhanden: AI-Analyse mit Fokus auf statistische Signifikanz
        const prompt = `Du bist Helix, ein freundlicher STAX-Coach. Analysiere diese User-Stats und gib eine kurze, wissenschaftlich fundierte Zusammenfassung (5-8 Sätze auf Deutsch).

STATS (basierend auf ${journalDays} Tagen Tracking):
- Aktueller Streak: ${stats.currentStreak} Tage
- Längster Streak: ${stats.longestStreak} Tage  
- Gesamt Check-ins: ${stats.totalCheckIns}
- Durchschnittliche Adherence: ${stats.adherencePercent}%
- Supplements im Stack: ${stats.stackSize}
- Journal-Einträge: ${stats.journalDays}
- Abgeschlossene Quests: ${stats.questsCompleted || 0}
- Durchschnittlicher Schlaf: ${stats.avgSleep?.toFixed(1) || 'N/A'}/10
- Durchschnittliche Energie: ${stats.avgEnergy?.toFixed(1) || 'N/A'}/10
- Durchschnittlicher Fokus: ${stats.avgFocus?.toFixed(1) || 'N/A'}/10

WICHTIGE REGELN:
1. NUR statistisch relevante Aussagen machen - keine Schlüsse aus 1-2 Tagen ziehen
2. Bei wenig Varianz ehrlich sagen: "Die Daten sind noch zu gleichmäßig für klare Trends"
3. Sei motivierend aber ehrlich - keine übertriebenen Behauptungen
4. Erwähne konkrete Muster NUR wenn sie über mehrere Tage konsistent sind
5. Wenn Durchschnittswerte nahe beieinander liegen, sag das auch
6. Gib einen konkreten, datenbasierten Tipp
7. Nutze passende Emojis
8. Schreibe auf Deutsch

BEISPIEL für ehrliche Analyse:
"Über ${journalDays} Tage sehe ich, dass dein Schlaf konstant bei X/10 liegt. Noch keine klaren Korrelationen erkennbar - tracke weiter für tiefere Insights!"`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'Du bist Helix, ein DNA-Maskottchen und wissenschaftlich fundierter STAX-Coach. Du machst NUR Aussagen, die durch ausreichend Daten gestützt sind. Du bist ehrlich über die Grenzen der verfügbaren Daten.' },
                { role: 'user', content: prompt }
            ],
            max_tokens: 500,
            temperature: 0.6, // Etwas weniger kreativ für präzisere Aussagen
        });

        const summary = completion.choices[0]?.message?.content || 'Keine Zusammenfassung verfügbar.';

        return NextResponse.json({ 
            summary,
            isCollecting: false,
            dataPoints: journalDays
        });

    } catch (error: any) {
        console.error('Summary API error:', error);
        return NextResponse.json(
            { error: error.message || 'Zusammenfassung konnte nicht erstellt werden' },
            { status: 500 }
        );
    }
}

