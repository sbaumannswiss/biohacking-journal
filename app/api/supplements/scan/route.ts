import { NextRequest, NextResponse } from 'next/server';
import { analyzeSupplementImage, isValidBase64Image } from '@/lib/agent/visionService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, userId } = body as { image: string; userId?: string };

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'Bild ist erforderlich' },
        { status: 400 }
      );
    }

    // Validate image
    if (!isValidBase64Image(image)) {
      return NextResponse.json(
        { success: false, error: 'Ungültiges Bildformat. Bitte JPEG, PNG oder WebP verwenden.' },
        { status: 400 }
      );
    }

    // Check image size (max ~10MB base64 = ~7.5MB actual)
    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Bild ist zu groß. Maximum 10MB.' },
        { status: 400 }
      );
    }

    // Optional: Rate limiting per user (basic implementation)
    // In production, use Redis or similar for rate limiting

    // Analyze image with GPT-4 Vision
    const result = await analyzeSupplementImage(image);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Supplement Scan API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ein Fehler ist aufgetreten',
        detected: null,
        match: { found: false, confidence: 'low' },
        helixComment: 'Ups, da ist etwas schiefgegangen! 😅',
      },
      { status: 500 }
    );
  }
}

