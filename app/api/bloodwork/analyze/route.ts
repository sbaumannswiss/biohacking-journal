import { NextRequest, NextResponse } from 'next/server';
import { analyzeBloodwork, isValidBloodworkImage } from '@/lib/agent/bloodworkService';

// Simple in-memory rate limiting (in production use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS_PER_DAY = 5;

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + dayInMs });
    return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - 1 };
  }
  
  if (userLimit.count >= MAX_REQUESTS_PER_DAY) {
    return { allowed: false, remaining: 0 };
  }
  
  userLimit.count++;
  return { allowed: true, remaining: MAX_REQUESTS_PER_DAY - userLimit.count };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image, userId } = body as { image: string; userId?: string };

    if (!image) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bild ist erforderlich',
          biomarkers: [],
          supplementSuggestions: [],
          summary: '',
          disclaimer: '',
        },
        { status: 400 }
      );
    }

    // Rate limiting
    if (userId) {
      const rateCheck = checkRateLimit(userId);
      if (!rateCheck.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Tageslimit erreicht. Du kannst maximal 5 Blutbilder pro Tag analysieren.',
            biomarkers: [],
            supplementSuggestions: [],
            summary: '',
            disclaimer: '',
          },
          { status: 429 }
        );
      }
    }

    // Validate image
    if (!isValidBloodworkImage(image)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Ungültiges Bildformat. Bitte JPEG, PNG oder WebP verwenden.',
          biomarkers: [],
          supplementSuggestions: [],
          summary: '',
          disclaimer: '',
        },
        { status: 400 }
      );
    }

    // Check image size (max ~10MB base64 = ~7.5MB actual)
    if (image.length > 10 * 1024 * 1024) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Bild ist zu groß. Maximum 10MB.',
          biomarkers: [],
          supplementSuggestions: [],
          summary: '',
          disclaimer: '',
        },
        { status: 400 }
      );
    }

    // Analyze bloodwork with GPT-4 Vision
    const result = await analyzeBloodwork(image);

    return NextResponse.json(result);

  } catch (error: any) {
    console.error('Bloodwork Analysis API Error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Ein Fehler ist aufgetreten',
        biomarkers: [],
        supplementSuggestions: [],
        summary: '',
        disclaimer: 'HINWEIS: Diese Analyse dient ausschließlich der Orientierung. Sie ersetzt keine ärztliche Beratung.',
      },
      { status: 500 }
    );
  }
}
