import { NextRequest, NextResponse } from 'next/server';
import { analyzeQuality } from '@/lib/agent/qualityAnalysisService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, supplementName, ingredients } = body as { 
      image: string; 
      supplementName?: string;
      ingredients?: string[];
    };

    if (!image) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bild ist erforderlich',
        },
        { status: 400 }
      );
    }

    // Check image size (max ~10MB base64)
    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bild ist zu groß. Maximum 10MB.',
        },
        { status: 400 }
      );
    }

    const analysis = await analyzeQuality(image, supplementName, ingredients);

    return NextResponse.json({
      success: true,
      ...analysis,
    });

  } catch (error: any) {
    console.error('Quality Analysis API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ein Fehler ist aufgetreten',
      },
      { status: 500 }
    );
  }
}
