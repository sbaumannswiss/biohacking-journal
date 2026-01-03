import { NextRequest, NextResponse } from 'next/server';
import { analyzeIngredientLabel, isValidBase64Image } from '@/lib/agent/visionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body as { image: string };

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Bild ist erforderlich', ingredients: [] },
        { status: 400 }
      );
    }

    if (!isValidBase64Image(image)) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges Bildformat', ingredients: [] },
        { status: 400 }
      );
    }

    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Bild ist zu groß (max 10MB)', ingredients: [] },
        { status: 400 }
      );
    }

    const result = await analyzeIngredientLabel(image);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Ingredient Scan API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ein Fehler ist aufgetreten',
        ingredients: [],
        helixComment: 'Ups, da ist etwas schiefgegangen! 😅',
      },
      { status: 500 }
    );
  }
}

