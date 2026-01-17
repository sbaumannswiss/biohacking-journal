import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/agent/openaiService';
import { buildUserContext } from '@/lib/agent/contextBuilder';
import { anonymizeContext, formatAnonymizedContextForPrompt } from '@/lib/agent/anonymizedContext';

/**
 * DSGVO-konformer Chat-Endpoint
 * 
 * Nur anonymisierte/kategorische Daten werden an OpenAI gesendet.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, conversationHistory = [] } = body;
    
    if (!message || !userId) {
      return NextResponse.json(
        { error: 'Message und userId sind erforderlich' },
        { status: 400 }
      );
    }
    
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API Key nicht konfiguriert' },
        { status: 500 }
      );
    }
    
    // Build user context
    const userContext = await buildUserContext(userId);
    
    // DSGVO: Anonymisiere Kontext bevor er an OpenAI gesendet wird
    const anonymizedUserContext = anonymizeContext(userContext);
    const anonymizedContextString = formatAnonymizedContextForPrompt(anonymizedUserContext);
    
    // Get response from OpenAI with anonymized context
    const response = await chat(message, anonymizedContextString, conversationHistory);
    
    // Nur nicht-personenbezogene Metadaten zurückgeben
    return NextResponse.json({ 
      response,
      context: {
        streakCategory: anonymizedUserContext.streakCategory,
        levelCategory: anonymizedUserContext.levelCategory,
        stackSize: anonymizedUserContext.stackSize,
      }
    });
    
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

