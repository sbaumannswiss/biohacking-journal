import { NextRequest, NextResponse } from 'next/server';
import { createQuest, getActiveQuests, completeQuest, cancelQuest } from '@/lib/agent/questService';

// GET - Hole aktive Quests
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId ist erforderlich' },
        { status: 400 }
      );
    }

    const quests = await getActiveQuests(userId);
    return NextResponse.json({ quests });
    
  } catch (error: any) {
    console.error('GET /api/quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// POST - Erstelle neue Quest
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, quest } = body;

    if (!userId || !quest) {
      return NextResponse.json(
        { error: 'userId und quest sind erforderlich' },
        { status: 400 }
      );
    }

    const result = await createQuest(userId, quest);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      quest: result.quest,
      message: 'Quest aktiviert! 🎯'
    });
    
  } catch (error: any) {
    console.error('POST /api/quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// PATCH - Quest abschließen oder abbrechen
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, questId, action } = body;

    if (!userId || !questId || !action) {
      return NextResponse.json(
        { error: 'userId, questId und action sind erforderlich' },
        { status: 400 }
      );
    }

    let result;
    if (action === 'complete') {
      result = await completeQuest(questId, userId);
      if (result.success) {
        return NextResponse.json({ 
          success: true, 
          xpEarned: result.xpEarned,
          message: `Quest abgeschlossen! +${result.xpEarned} XP 🎉`
        });
      }
    } else if (action === 'cancel') {
      result = await cancelQuest(questId, userId);
      if (result.success) {
        return NextResponse.json({ 
          success: true,
          message: 'Quest abgebrochen'
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Ungültige action. Erlaubt: complete, cancel' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: result?.error || 'Aktion fehlgeschlagen' },
      { status: 500 }
    );
    
  } catch (error: any) {
    console.error('PATCH /api/quests error:', error);
    return NextResponse.json(
      { error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

