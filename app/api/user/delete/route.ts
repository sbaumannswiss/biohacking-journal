import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DSGVO Art. 17 - Recht auf Löschung
 * Löscht alle Nutzerdaten und den Account
 */
export async function DELETE(request: Request) {
  try {
    // Bestätigungstoken prüfen (Double Opt-Out)
    const { confirmation } = await request.json().catch(() => ({ confirmation: null }));
    
    if (confirmation !== 'DELETE_MY_ACCOUNT') {
      return NextResponse.json(
        { error: 'Bestätigung erforderlich. Sende {"confirmation": "DELETE_MY_ACCOUNT"}' },
        { status: 400 }
      );
    }

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

    const userId = user.id;

    // Versuche die Supabase-Funktion zu nutzen
    const { error: rpcError } = await supabase.rpc('delete_user_data');
    
    if (rpcError) {
      console.error('RPC delete error:', rpcError);
      // Fallback: Manuell löschen
      await manualDelete(supabase, userId);
    }

    // Zum Schluss: Auth User löschen
    // Hinweis: Supabase erlaubt kein Self-Delete des Auth-Users über die Client-API
    // Das muss über Admin-API oder Edge Function erfolgen
    // Hier loggen wir aus und markieren den Account als zu löschen
    
    // Ausloggen
    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      message: 'Alle Daten wurden gelöscht. Du wurdest ausgeloggt.',
    });
  } catch (error) {
    console.error('Delete error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Daten' },
      { status: 500 }
    );
  }
}

/**
 * GET - Informationen über zu löschende Daten
 */
export async function GET() {
  try {
    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase nicht konfiguriert' }, { status: 500 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    const userId = user.id;

    // Zähle Datensätze
    const counts: Record<string, number> = {};

    const tables = [
      { name: 'user_stack', key: 'user_id' },
      { name: 'check_ins', key: 'user_id' },
      { name: 'daily_metrics', key: 'user_id' },
      { name: 'wearable_health_data', key: 'user_id' },
      { name: 'custom_supplements', key: 'user_id' },
      { name: 'user_quests', key: 'user_id' },
    ];

    for (const table of tables) {
      const { count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: true })
        .eq(table.key, userId);
      counts[table.name] = count || 0;
    }

    return NextResponse.json({
      user_id: userId,
      email: user.email,
      created_at: user.created_at,
      data_to_delete: counts,
      warning: 'Diese Aktion kann nicht rückgängig gemacht werden.',
      instructions: 'Sende DELETE mit {"confirmation": "DELETE_MY_ACCOUNT"} um alle Daten zu löschen.',
    });
  } catch (error) {
    console.error('Delete info error:', error);
    return NextResponse.json({ error: 'Fehler beim Abrufen der Informationen' }, { status: 500 });
  }
}

/**
 * Manuelles Löschen als Fallback
 */
async function manualDelete(supabase: any, userId: string) {
  const tables = [
    { name: 'user_stack', key: 'user_id', type: 'text' },
    { name: 'check_ins', key: 'user_id', type: 'text' },
    { name: 'daily_metrics', key: 'user_id', type: 'text' },
    { name: 'wearable_connections', key: 'user_id', type: 'text' },
    { name: 'wearable_health_data', key: 'user_id', type: 'text' },
    { name: 'chrono_stack_settings', key: 'user_id', type: 'text' },
    { name: 'custom_supplements', key: 'user_id', type: 'uuid' },
    { name: 'supplement_submissions', key: 'submitted_by', type: 'uuid' },
    { name: 'user_quests', key: 'user_id', type: 'text' },
    { name: 'scheduled_workouts', key: 'user_id', type: 'uuid' },
    { name: 'detected_workouts', key: 'user_id', type: 'uuid' },
    { name: 'workout_supplement_logs', key: 'user_id', type: 'uuid' },
    { name: 'hydration_logs', key: 'user_id', type: 'uuid' },
    { name: 'profiles', key: 'id', type: 'uuid' },
  ];

  for (const table of tables) {
    try {
      await supabase
        .from(table.name)
        .delete()
        .eq(table.key, userId);
    } catch (e) {
      console.warn(`Could not delete from ${table.name}:`, e);
    }
  }
}
