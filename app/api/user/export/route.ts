import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DSGVO Art. 20 - Datenportabilität
 * Exportiert alle Nutzerdaten als JSON
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase nicht konfiguriert' },
        { status: 500 }
      );
    }

    // User prüfen
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }

    // Alle Daten über die Supabase-Funktion exportieren
    const { data, error } = await supabase.rpc('export_user_data');

    if (error) {
      console.error('Export error:', error);
      
      // Fallback: Manuell alle Tabellen abfragen
      const exportData = await manualExport(supabase, user.id);
      
      return new NextResponse(JSON.stringify(exportData, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="stax-export-${new Date().toISOString().split('T')[0]}.json"`,
        },
      });
    }

    // Als Download zurückgeben
    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="stax-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Exportieren der Daten' },
      { status: 500 }
    );
  }
}

/**
 * Manueller Export als Fallback
 */
async function manualExport(supabase: any, userId: string) {
  const result: Record<string, any> = {
    exported_at: new Date().toISOString(),
    user_id: userId,
  };

  // Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  result.profile = profile || null;

  // User Stack
  const { data: stack } = await supabase
    .from('user_stack')
    .select('*')
    .eq('user_id', userId);
  result.user_stack = stack || [];

  // Check-Ins
  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('user_id', userId);
  result.check_ins = checkIns || [];

  // Daily Metrics
  const { data: metrics } = await supabase
    .from('daily_metrics')
    .select('*')
    .eq('user_id', userId);
  result.daily_metrics = metrics || [];

  // Wearable Health Data
  const { data: healthData } = await supabase
    .from('wearable_health_data')
    .select('*')
    .eq('user_id', userId);
  result.wearable_health_data = healthData || [];

  // Custom Supplements
  const { data: customSupplements } = await supabase
    .from('custom_supplements')
    .select('*')
    .eq('user_id', userId);
  result.custom_supplements = customSupplements || [];

  // User Quests
  const { data: quests } = await supabase
    .from('user_quests')
    .select('*')
    .eq('user_id', userId);
  result.user_quests = quests || [];

  // Workouts
  const { data: scheduledWorkouts } = await supabase
    .from('scheduled_workouts')
    .select('*')
    .eq('user_id', userId);
  result.scheduled_workouts = scheduledWorkouts || [];

  const { data: detectedWorkouts } = await supabase
    .from('detected_workouts')
    .select('*')
    .eq('user_id', userId);
  result.detected_workouts = detectedWorkouts || [];

  // Hydration
  const { data: hydration } = await supabase
    .from('hydration_logs')
    .select('*')
    .eq('user_id', userId);
  result.hydration_logs = hydration || [];

  return result;
}

/**
 * CSV Export Option
 */
export async function POST(request: Request) {
  try {
    const { format = 'json' } = await request.json();
    
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const exportData = await manualExport(supabase, user.id);

    if (format === 'csv') {
      // CSV für die wichtigsten Daten
      const csvContent = generateCSV(exportData);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="stax-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="stax-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Fehler beim Exportieren' }, { status: 500 });
  }
}

function generateCSV(data: Record<string, any>): string {
  const lines: string[] = [];
  
  // Daily Metrics als CSV
  lines.push('=== DAILY METRICS ===');
  lines.push('date,sleep_quality,energy_level,focus_score,mood_score,stress_level');
  
  (data.daily_metrics || []).forEach((m: any) => {
    lines.push(`${m.date},${m.sleep_quality || ''},${m.energy_level || ''},${m.focus_score || ''},${m.mood_score || ''},${m.stress_level || ''}`);
  });

  lines.push('');
  lines.push('=== CHECK-INS ===');
  lines.push('supplement_id,checked_at,xp_earned');
  
  (data.check_ins || []).forEach((c: any) => {
    lines.push(`${c.supplement_id},${c.checked_at},${c.xp_earned || 0}`);
  });

  lines.push('');
  lines.push('=== HEALTH DATA ===');
  lines.push('date,provider,sleep_score,hrv_average,resting_heart_rate,steps');
  
  (data.wearable_health_data || []).forEach((h: any) => {
    lines.push(`${h.date},${h.provider},${h.sleep_score || ''},${h.hrv_average || ''},${h.resting_heart_rate || ''},${h.steps || ''}`);
  });

  return lines.join('\n');
}
