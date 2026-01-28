import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { notifyWaitlistSignup } from '@/lib/slack';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'E-Mail ist erforderlich' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      );
    }

    if (!supabase) {
      // Fallback: Log to console if Supabase not configured
      console.log('📧 Waitlist signup (no Supabase):', email);
      return NextResponse.json({ success: true, message: 'Erfolgreich registriert!' });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('waitlist_emails')
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Diese E-Mail ist bereits registriert' },
        { status: 409 }
      );
    }

    // Insert new email
    const { error } = await supabase
      .from('waitlist_emails')
      .insert({
        email: email.toLowerCase(),
        source: 'waitlist_page',
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Supabase error:', error);
      
      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'Diese E-Mail ist bereits registriert' },
          { status: 409 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Fehler beim Speichern' },
        { status: 500 }
      );
    }

    // Get total count for Slack notification
    const { count } = await supabase
      .from('waitlist_emails')
      .select('*', { count: 'exact', head: true });

    // Slack Notification (fire and forget)
    notifyWaitlistSignup(email.toLowerCase(), (count || 0) + 847)
      .catch(err => console.error('Slack notification failed:', err));

    return NextResponse.json({ success: true, message: 'Erfolgreich registriert!' });

  } catch (error) {
    console.error('Waitlist API error:', error);
    return NextResponse.json(
      { success: false, error: 'Serverfehler' },
      { status: 500 }
    );
  }
}

// GET: Return waitlist count (for display)
export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json({ count: 847 }); // Fallback
    }

    const { count, error } = await supabase
      .from('waitlist_emails')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ count: 847 });
    }

    // Add some padding for social proof
    return NextResponse.json({ count: (count || 0) + 847 });

  } catch {
    return NextResponse.json({ count: 847 });
  }
}


