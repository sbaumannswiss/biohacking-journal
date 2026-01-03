import { NextRequest, NextResponse } from 'next/server';
import { submitSupplement, ParsedSupplementSuggestion, supplementExists } from '@/lib/agent/supplementService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, supplement } = body as { 
      userId: string; 
      supplement: ParsedSupplementSuggestion;
    };

    if (!userId || !supplement) {
      return NextResponse.json(
        { success: false, error: 'userId und supplement sind erforderlich' },
        { status: 400 }
      );
    }

    if (!supplement.name || !supplement.description) {
      return NextResponse.json(
        { success: false, error: 'Name und Beschreibung sind erforderlich' },
        { status: 400 }
      );
    }

    // Check if supplement already exists
    if (supplementExists(supplement.name)) {
      return NextResponse.json(
        { success: false, error: 'Dieses Supplement existiert bereits in der Library!' },
        { status: 409 }
      );
    }

    const result = await submitSupplement(supplement, userId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: result.id,
      message: 'Supplement erfolgreich eingereicht! Es wird geprüft und dann zur Library hinzugefügt.'
    });

  } catch (error: any) {
    console.error('Supplement Submit API Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

// GET: Fetch user's submissions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId ist erforderlich' },
        { status: 400 }
      );
    }

    const { getUserSubmissions } = await import('@/lib/agent/supplementService');
    const submissions = await getUserSubmissions(userId);

    return NextResponse.json({ 
      success: true, 
      submissions 
    });

  } catch (error: any) {
    console.error('Supplement Submissions GET Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    );
  }
}

