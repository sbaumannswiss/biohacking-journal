import { supabase } from '@/lib/supabase';

export interface UserQuest {
  id: string;
  user_id: string;
  title: string;
  description: string;
  xp_reward: number;
  duration?: string;
  category?: string;
  status: 'active' | 'completed' | 'expired' | 'cancelled';
  progress: number;
  target_value?: number;
  current_value: number;
  source: 'helix' | 'system' | 'manual';
  created_at: string;
  completed_at?: string;
  expires_at?: string;
}

export interface CreateQuestInput {
  title: string;
  description: string;
  xp_reward?: number;
  duration?: string;
  category?: string;
  target_value?: number;
  expires_at?: string;
}

// Erstelle eine neue Quest
export async function createQuest(
  userId: string,
  quest: CreateQuestInput
): Promise<{ success: boolean; quest?: UserQuest; error?: string }> {
  if (!supabase) {
    // Fallback: Speichere lokal wenn Supabase nicht verfügbar
    console.warn('Supabase nicht konfiguriert - Quest wird nicht persistiert');
    const localQuest: UserQuest = {
      id: crypto.randomUUID(),
      user_id: userId,
      title: quest.title,
      description: quest.description,
      xp_reward: quest.xp_reward || 100,
      duration: quest.duration,
      category: quest.category,
      status: 'active',
      progress: 0,
      target_value: quest.target_value,
      current_value: 0,
      source: 'helix',
      created_at: new Date().toISOString(),
    };
    return { success: true, quest: localQuest };
  }

  try {
    const { data, error } = await supabase
      .from('user_quests')
      .insert({
        user_id: userId,
        title: quest.title,
        description: quest.description,
        xp_reward: quest.xp_reward || 100,
        duration: quest.duration,
        category: quest.category,
        target_value: quest.target_value,
        expires_at: quest.expires_at,
        source: 'helix',
        status: 'active',
        progress: 0,
        current_value: 0,
      })
      .select()
      .single();

    if (error) {
      // Tabelle existiert vielleicht noch nicht
      if (error.code === '42P01') {
        console.warn('user_quests Tabelle existiert nicht - bitte SQL ausführen');
        return { success: false, error: 'Quest-Tabelle nicht gefunden. Bitte SQL in Supabase ausführen.' };
      }
      throw error;
    }

    return { success: true, quest: data };
  } catch (error: any) {
    console.error('createQuest error:', error);
    return { success: false, error: error.message || 'Quest konnte nicht erstellt werden' };
  }
}

// Hole alle aktiven Quests eines Users
export async function getActiveQuests(userId: string): Promise<UserQuest[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getActiveQuests error:', error);
    return [];
  }
}

// Hole alle Quests (inkl. abgeschlossene)
export async function getAllQuests(userId: string): Promise<UserQuest[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('user_quests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('getAllQuests error:', error);
    return [];
  }
}

// Quest abschließen
export async function completeQuest(
  questId: string,
  userId: string
): Promise<{ success: boolean; xpEarned?: number; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  try {
    // Hole die Quest
    const { data: quest, error: fetchError } = await supabase
      .from('user_quests')
      .select('*')
      .eq('id', questId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !quest) {
      return { success: false, error: 'Quest nicht gefunden' };
    }

    // Update Quest Status
    const { error: updateError } = await supabase
      .from('user_quests')
      .update({
        status: 'completed',
        progress: 100,
        completed_at: new Date().toISOString(),
      })
      .eq('id', questId);

    if (updateError) throw updateError;

    // XP hinzufügen
    const { data: userData } = await supabase
      .from('user_xp')
      .select('total_xp')
      .eq('user_id', userId)
      .single();

    const currentXp = userData?.total_xp || 0;
    const newXp = currentXp + quest.xp_reward;

    await supabase
      .from('user_xp')
      .upsert({
        user_id: userId,
        total_xp: newXp,
      }, { onConflict: 'user_id' });

    return { success: true, xpEarned: quest.xp_reward };
  } catch (error: any) {
    console.error('completeQuest error:', error);
    return { success: false, error: error.message };
  }
}

// Quest Fortschritt aktualisieren
export async function updateQuestProgress(
  questId: string,
  userId: string,
  newValue: number
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  try {
    // Hole die Quest für target_value
    const { data: quest } = await supabase
      .from('user_quests')
      .select('target_value')
      .eq('id', questId)
      .single();

    const targetValue = quest?.target_value || 100;
    const progress = Math.min(100, Math.round((newValue / targetValue) * 100));

    const { error } = await supabase
      .from('user_quests')
      .update({
        current_value: newValue,
        progress,
      })
      .eq('id', questId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('updateQuestProgress error:', error);
    return { success: false, error: error.message };
  }
}

// Quest abbrechen
export async function cancelQuest(
  questId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  try {
    const { error } = await supabase
      .from('user_quests')
      .update({ status: 'cancelled' })
      .eq('id', questId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('cancelQuest error:', error);
    return { success: false, error: error.message };
  }
}

// Parse Quest aus Helix-Antwort
export function parseQuestFromMessage(message: string): CreateQuestInput | null {
  // Suche nach Quest-Pattern in der Nachricht
  const questMatch = message.match(/🎯\s*\*\*Quest:\s*([^*]+)\*\*/i);
  const descMatch = message.match(/🎯\s*\*\*Quest:[^*]+\*\*\s*\n([^\n]+)/i);
  const durationMatch = message.match(/⏱️\s*\*\*Dauer:\*\*\s*([^\n]+)/i);
  const xpMatch = message.match(/🏆\s*\*\*Belohnung:\*\*\s*(\d+)\s*XP/i);

  if (!questMatch) return null;

  const title = questMatch[1].trim();
  const description = descMatch ? descMatch[1].trim() : title;
  const duration = durationMatch ? durationMatch[1].trim() : undefined;
  const xp = xpMatch ? parseInt(xpMatch[1]) : 100;

  // Parse target value from duration (e.g., "7 Tage" -> 7)
  const targetMatch = duration?.match(/(\d+)/);
  const targetValue = targetMatch ? parseInt(targetMatch[1]) : undefined;

  return {
    title,
    description,
    xp_reward: xp,
    duration,
    target_value: targetValue,
  };
}

