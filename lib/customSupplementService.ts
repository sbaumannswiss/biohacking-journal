import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ComboIngredient } from '@/lib/agent/visionService';

/**
 * Custom Supplement - Persönliches Kombi-Präparat eines Users
 */
export interface CustomSupplement {
  id?: string;
  user_id: string;
  name: string;
  brand?: string;
  emoji: string;
  description?: string;
  serving_size?: string;
  ingredients: ComboIngredient[];
  best_time?: string;
  warnings?: string;
  image_base64?: string; // Optional: Produktbild
  created_at?: string;
  evidence_level?: number; // 1-5 basierend auf wissenschaftlicher Evidenz
  
  // Für zentrales System
  submitted_to_central: boolean;
  central_submission_id?: string;
}

/**
 * Speichert ein Custom-Supplement in der persönlichen Library des Users
 */
export async function saveCustomSupplement(
  userId: string,
  supplement: Omit<CustomSupplement, 'id' | 'user_id' | 'created_at' | 'submitted_to_central'>
): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  try {
    // Destructure to exclude evidence_level (not in DB schema)
    const { evidence_level, ...supplementData } = supplement;
    
    const { data, error } = await supabase
      .from('custom_supplements')
      .insert({
        user_id: userId,
        ...supplementData,
        submitted_to_central: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error saving custom supplement:', error);
      
      // Check if table doesn't exist
      if (error.message.includes('Could not find the table') || error.code === '42P01') {
        return { 
          success: false, 
          error: 'Tabelle nicht vorhanden. Bitte führe die Migration in Supabase aus (SQL Editor → 004_custom_supplements.sql)' 
        };
      }
      
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err: any) {
    console.error('Exception saving custom supplement:', err);
    return { success: false, error: err.message || 'Unbekannter Fehler' };
  }
}

/**
 * Holt alle Custom-Supplements eines Users
 */
export async function getUserCustomSupplements(userId: string): Promise<CustomSupplement[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('custom_supplements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching custom supplements:', error);
    return [];
  }

  return data || [];
}

/**
 * Löscht ein Custom-Supplement
 */
export async function deleteCustomSupplement(
  userId: string, 
  supplementId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  const { error } = await supabase
    .from('custom_supplements')
    .delete()
    .eq('id', supplementId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting custom supplement:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Reicht ein Custom-Supplement ans zentrale System ein
 */
export async function submitToCentralSystem(
  userId: string,
  supplementId: string,
  supplement: CustomSupplement
): Promise<{ success: boolean; submissionId?: string; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  // Erstelle Submission für zentrales Review
  const { data: submission, error: submitError } = await supabase
    .from('supplement_submissions')
    .insert({
      name: supplement.name,
      description: supplement.description || `Kombi-Präparat mit ${supplement.ingredients.length} Wirkstoffen`,
      benefits: supplement.ingredients.map(i => i.name).slice(0, 5), // Top 5 Ingredients als Benefits
      evidence_level: supplement.evidence_level || 3, // AI-analysiertes Level oder Fallback
      optimal_dosage: supplement.serving_size || '1 Portion',
      best_time: supplement.best_time || 'With Meals',
      warnings: supplement.warnings,
      emoji: supplement.emoji,
      affects_metrics: [], // Kann später von Admin ergänzt werden
      submitted_by: userId,
      status: 'pending',
      agent_notes: `Kombi-Präparat gescannt. Inhaltsstoffe: ${supplement.ingredients.map(i => `${i.name} ${i.dosage}${i.unit}`).join(', ')}`,
    })
    .select('id')
    .single();

  if (submitError) {
    console.error('Error submitting to central:', submitError);
    return { success: false, error: submitError.message };
  }

  // Markiere Custom-Supplement als eingereicht
  const { error: updateError } = await supabase
    .from('custom_supplements')
    .update({
      submitted_to_central: true,
      central_submission_id: submission?.id,
    })
    .eq('id', supplementId)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating custom supplement:', updateError);
  }

  return { success: true, submissionId: submission?.id };
}

/**
 * Fügt ein Custom-Supplement zum User-Stack hinzu
 */
export async function addCustomToStack(
  userId: string,
  customSupplementId: string,
  dosage?: string,
  time?: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  // Prüfe ob schon im Stack
  const { data: existing } = await supabase
    .from('user_stack')
    .select('id')
    .eq('user_id', userId)
    .eq('supplement_id', `custom:${customSupplementId}`)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Bereits im Stack' };
  }

  const supplementId = `custom:${customSupplementId}`;

  const { error } = await supabase
    .from('user_stack')
    .insert({
      user_id: userId,
      supplement_id: supplementId,
      custom_dosage: dosage,
      custom_time: time,
    })
    .select();

  if (error) {
    console.error('Error adding custom to stack:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

