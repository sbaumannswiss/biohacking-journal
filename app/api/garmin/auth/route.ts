/**
 * Garmin OAuth Step 1: Initiate Authentication
 * 
 * GET /api/garmin/auth
 * 
 * Starts the OAuth 1.0a flow by getting a request token
 * and redirecting to Garmin's authorization page.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRequestToken, getAuthorizationUrl } from '@/lib/garmin';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get callback URL
    const baseUrl = request.nextUrl.origin;
    const callbackUrl = `${baseUrl}/api/garmin/callback`;

    // Get user ID from query (passed from frontend)
    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

    // Step 1: Get request token from Garmin
    const { oauth_token, oauth_token_secret } = await getRequestToken(callbackUrl);

    // Store token secret in cookie (needed for step 3)
    // In production, store in Redis or database with short TTL
    const cookieStore = await cookies();
    cookieStore.set('garmin_oauth_token_secret', oauth_token_secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600 // 10 minutes
    });
    cookieStore.set('garmin_oauth_user_id', userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600
    });

    // Step 2: Redirect to Garmin authorization page
    const authUrl = getAuthorizationUrl(oauth_token);
    
    return NextResponse.redirect(authUrl);
  } catch (error: any) {
    console.error('Garmin auth error:', error);
    
    // Redirect back to settings with error
    const baseUrl = request.nextUrl.origin;
    return NextResponse.redirect(
      `${baseUrl}/profile?error=garmin_auth_failed&message=${encodeURIComponent(error.message)}`
    );
  }
}

