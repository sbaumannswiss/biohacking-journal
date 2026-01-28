/**
 * Unknown Ingredient/Certification Logger
 * 
 * Loggt unbekannte Daten in Supabase und sendet Slack Notifications.
 * Deduplizierung erfolgt in der Datenbank via UPSERT.
 */

import { createClient } from '@supabase/supabase-js';
import { notifyUnknownIngredient, notifyUnknownCertification } from '@/lib/slack';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Schwellenwert für Slack Notification (bei erstem Auftreten und dann alle X)
const NOTIFICATION_THRESHOLDS = [1, 5, 10, 25, 50, 100];

interface LogResult {
  logged: boolean;
  isNew: boolean;
  occurrences: number;
  shouldNotify: boolean;
}

/**
 * Loggt einen unbekannten Inhaltsstoff
 */
export async function logUnknownIngredient(
  ingredientName: string,
  form: string,
  context?: string
): Promise<LogResult> {
  try {
    // Upsert via RPC (Funktion in Supabase)
    const { data, error } = await supabase.rpc('upsert_unknown_ingredient', {
      p_ingredient_name: ingredientName,
      p_form: form || 'unknown',
      p_context: context,
    });

    if (error) {
      // Fallback: Direktes Insert/Update
      const { data: existing } = await supabase
        .from('unknown_ingredients')
        .select('id, occurrences')
        .eq('ingredient_name', ingredientName)
        .eq('form', form || 'unknown')
        .single();

      if (existing) {
        await supabase
          .from('unknown_ingredients')
          .update({ 
            occurrences: existing.occurrences + 1,
            last_seen_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        const newCount = existing.occurrences + 1;
        return {
          logged: true,
          isNew: false,
          occurrences: newCount,
          shouldNotify: NOTIFICATION_THRESHOLDS.includes(newCount),
        };
      } else {
        await supabase
          .from('unknown_ingredients')
          .insert({
            ingredient_name: ingredientName,
            form: form || 'unknown',
            context,
          });

        return {
          logged: true,
          isNew: true,
          occurrences: 1,
          shouldNotify: true,
        };
      }
    }

    // RPC erfolgreich - hole aktuellen Stand
    const { data: current } = await supabase
      .from('unknown_ingredients')
      .select('occurrences')
      .eq('ingredient_name', ingredientName)
      .eq('form', form || 'unknown')
      .single();

    const occurrences = current?.occurrences || 1;
    
    return {
      logged: true,
      isNew: occurrences === 1,
      occurrences,
      shouldNotify: NOTIFICATION_THRESHOLDS.includes(occurrences),
    };

  } catch (err) {
    console.error('Failed to log unknown ingredient:', err);
    return { logged: false, isNew: false, occurrences: 0, shouldNotify: false };
  }
}

/**
 * Loggt eine unbekannte Zertifizierung
 */
export async function logUnknownCertification(
  certificationName: string
): Promise<LogResult> {
  try {
    const { data: existing } = await supabase
      .from('unknown_certifications')
      .select('id, occurrences')
      .eq('certification_name', certificationName)
      .single();

    if (existing) {
      await supabase
        .from('unknown_certifications')
        .update({ 
          occurrences: existing.occurrences + 1,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      const newCount = existing.occurrences + 1;
      return {
        logged: true,
        isNew: false,
        occurrences: newCount,
        shouldNotify: NOTIFICATION_THRESHOLDS.includes(newCount),
      };
    } else {
      await supabase
        .from('unknown_certifications')
        .insert({ certification_name: certificationName });

      return {
        logged: true,
        isNew: true,
        occurrences: 1,
        shouldNotify: true,
      };
    }
  } catch (err) {
    console.error('Failed to log unknown certification:', err);
    return { logged: false, isNew: false, occurrences: 0, shouldNotify: false };
  }
}

/**
 * Loggt alle unbekannten Daten aus einer Qualitätsanalyse
 */
export async function logUnknownQualityData(
  unknownIngredients: { name: string; form: string }[],
  unknownCertifications: string[],
  context?: string
): Promise<{
  ingredientsLogged: number;
  certificationsLogged: number;
  notificationsSent: number;
}> {
  let ingredientsLogged = 0;
  let certificationsLogged = 0;
  let notificationsSent = 0;

  // Log ingredients
  for (const ing of unknownIngredients) {
    const result = await logUnknownIngredient(ing.name, ing.form, context);
    if (result.logged) ingredientsLogged++;
    
    if (result.shouldNotify) {
      const sent = await notifyUnknownIngredient(ing.name, ing.form, context, result.occurrences);
      if (sent) notificationsSent++;
    }
  }

  // Log certifications
  for (const cert of unknownCertifications) {
    const result = await logUnknownCertification(cert);
    if (result.logged) certificationsLogged++;
    
    if (result.shouldNotify) {
      const sent = await notifyUnknownCertification(cert, result.occurrences);
      if (sent) notificationsSent++;
    }
  }

  return { ingredientsLogged, certificationsLogged, notificationsSent };
}
