import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EVIDENCE_SYSTEM_PROMPT = `Du bist Helix. Gib eine ULTRA-KURZE Analyse im exakten Format:

🎯 [Hauptwirkung in 3-5 Wörtern]
⏰ [Einnahmezeit, z.B. "Morgens nüchtern"]
🔗 [Gut kombinierbar mit X]
⚡ [Wirkungseintritt, z.B. "2-4 Wochen"]

REGELN:
- Exakt 4 Zeilen, keine mehr
- Jede Zeile max 25 Zeichen nach dem Emoji
- Keine Sätze, nur Stichworte
- Deutsch`;

const COMBO_EVIDENCE_PROMPT = `Du bist Helix. Gib eine ULTRA-KURZE Analyse im exakten Format:

🎯 [Hauptwirkung in 3-5 Wörtern]
⏰ [Einnahmezeit, z.B. "Morgens nüchtern"]
🔗 [Gut kombinierbar mit X]
⚡ [Wirkungseintritt, z.B. "2-4 Wochen"]

REGELN:
- Exakt 4 Zeilen, keine mehr
- Jede Zeile max 25 Zeichen nach dem Emoji
- Keine Sätze, nur Stichworte
- Deutsch`;

export async function POST(request: NextRequest) {
  try {
    const { name, description, benefits, evidence_level, isCombo, ingredients } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Kombi-Präparat - spezielle Analyse
    if (isCombo && ingredients?.length > 0) {
      const ingredientList = ingredients
        .map((i: { name: string; dosage: string; unit: string }) => `${i.name}: ${i.dosage}${i.unit}`)
        .join('\n');

      if (!process.env.OPENAI_API_KEY) {
        // Fallback ohne API-Key
        const mainIngredient = ingredients[0]?.name || 'Wirkstoffe';
        return NextResponse.json({
          evidence: `🎯 ${mainIngredient} Komplex\n⏰ Mit Mahlzeit\n🔗 Gut solo\n⚡ 2-4 Wochen`
        });
      }

      const comboPrompt = `Analysiere das Kombi-Präparat "${name}":

Enthaltene Wirkstoffe:
${ingredientList}

Gib eine kurze, freundliche Analyse der Wirkstoff-Kombination.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: COMBO_EVIDENCE_PROMPT },
          { role: 'user', content: comboPrompt },
        ],
        max_tokens: 80,
        temperature: 0.5,
      });

      const evidence = completion.choices[0]?.message?.content || 'Keine Analyse verfügbar.';
      return NextResponse.json({ evidence });
    }

    // Standard Supplement Analyse
    if (!process.env.OPENAI_API_KEY) {
      // Fallback ohne API-Key
      return NextResponse.json({
        evidence: `🎯 ${benefits?.[0] || 'Gesundheit'}\n⏰ Mit Mahlzeit\n🔗 Gut solo\n⚡ 2-4 Wochen`
      });
    }

    const userPrompt = `Supplement: "${name}". Hauptnutzen: ${benefits?.join(', ') || 'Allgemein'}`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: EVIDENCE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 80,
      temperature: 0.5,
    });

    const evidence = completion.choices[0]?.message?.content || 'Keine Analyse verfügbar.';

    return NextResponse.json({ evidence });

  } catch (error: any) {
    console.error('Evidence API error:', error);
    return NextResponse.json(
      { error: error.message || 'Analyse fehlgeschlagen' },
      { status: 500 }
    );
  }
}

