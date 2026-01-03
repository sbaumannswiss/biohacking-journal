import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/agent/openaiService';
import { buildUserContext, formatContextForPrompt } from '@/lib/agent/contextBuilder';

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
    const contextString = formatContextForPrompt(userContext);
    
    // Get response from OpenAI
    const response = await chat(message, contextString, conversationHistory);
    
    return NextResponse.json({ 
      response,
      context: {
        streak: userContext.user.streak,
        level: userContext.user.level,
        stackSize: userContext.stack.length,
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

