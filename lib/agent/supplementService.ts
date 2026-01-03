import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { SUPPLEMENT_LIBRARY } from '@/data/supplements';

/**
 * Supplement Submission System
 * 
 * Users can suggest new supplements via the Helix agent.
 * The agent analyzes the suggestion and creates a structured entry.
 * Submissions are stored in Supabase for review.
 */

export interface SupplementSubmission {
  id?: string;
  name: string;
  description: string;
  benefits: string[];
  evidence_level: number; // 1-5
  optimal_dosage: string;
  best_time: string;
  warnings?: string;
  emoji: string;
  affects_metrics?: {
    metric: string;
    effect: 'positive' | 'negative' | 'neutral';
    strength: number;
  }[];
  synergies?: string[];
  // Submission metadata
  submitted_by: string; // userId
  status: 'pending' | 'approved' | 'rejected';
  agent_notes?: string; // Helix's analysis
  created_at?: string;
}

export interface ParsedSupplementSuggestion {
  name: string;
  description: string;
  benefits: string[];
  evidence_level: number;
  optimal_dosage: string;
  best_time: string;
  warnings?: string;
  emoji: string;
  affects_metrics?: {
    metric: string;
    effect: 'positive' | 'negative' | 'neutral';
    strength: number;
  }[];
  synergies?: string[];
  agent_notes?: string;
}

/**
 * Check if a supplement already exists in the library
 */
export function supplementExists(name: string): boolean {
  const normalizedName = name.toLowerCase().trim();
  return SUPPLEMENT_LIBRARY.some(s => 
    s.name.toLowerCase().includes(normalizedName) ||
    s.id.toLowerCase().includes(normalizedName.replace(/\s+/g, '-'))
  );
}

/**
 * Generate a unique ID for a supplement
 */
export function generateSupplementId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Parse a supplement suggestion from the agent's response
 */
export function parseSupplementFromMessage(message: string): ParsedSupplementSuggestion | null {
  // Look for structured supplement format
  const supplementMatch = message.match(/🧪\s*\*\*(?:Supplement-Analyse|Neues Supplement):\s*(.+?)\*\*/i);
  
  if (!supplementMatch) return null;

  const name = supplementMatch[1].trim();
  
  // Extract description
  const descMatch = message.match(/📝\s*\*\*Beschreibung:\*\*\s*(.+?)(?=\n|$)/i);
  const description = descMatch?.[1]?.trim() || '';
  
  // Extract benefits
  const benefitsMatch = message.match(/✨\s*\*\*Benefits:\*\*\s*(.+?)(?=\n|$)/i);
  const benefits = benefitsMatch?.[1]?.split(',').map(b => b.trim()) || [];
  
  // Extract evidence level
  const evidenceMatch = message.match(/📊\s*\*\*Evidenz-Level:\*\*\s*(\d)/i);
  const evidence_level = evidenceMatch ? parseInt(evidenceMatch[1]) : 3;
  
  // Extract dosage
  const dosageMatch = message.match(/💊\s*\*\*Dosierung:\*\*\s*(.+?)(?=\n|$)/i);
  const optimal_dosage = dosageMatch?.[1]?.trim() || '';
  
  // Extract timing
  const timeMatch = message.match(/⏰\s*\*\*Einnahme:\*\*\s*(.+?)(?=\n|$)/i);
  const best_time = timeMatch?.[1]?.trim() || 'With Meals';
  
  // Extract warnings
  const warningsMatch = message.match(/⚠️\s*\*\*Hinweise:\*\*\s*(.+?)(?=\n|$)/i);
  const warnings = warningsMatch?.[1]?.trim();
  
  // Extract emoji
  const emojiMatch = message.match(/🎨\s*\*\*Emoji:\*\*\s*(.+?)(?=\n|$)/i);
  const emoji = emojiMatch?.[1]?.trim() || '💊';
  
  // Extract agent notes
  const notesMatch = message.match(/🧬\s*\*\*Helix-Analyse:\*\*\s*(.+?)(?=\n\n|$)/is);
  const agent_notes = notesMatch?.[1]?.trim();

  if (!name || !description) return null;

  return {
    name,
    description,
    benefits,
    evidence_level,
    optimal_dosage,
    best_time,
    warnings,
    emoji,
    agent_notes,
  };
}

/**
 * Submit a new supplement suggestion to Supabase
 */
export async function submitSupplement(
  suggestion: ParsedSupplementSuggestion,
  userId: string
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  // Check if supplement already exists
  if (supplementExists(suggestion.name)) {
    return { success: false, error: 'Dieses Supplement existiert bereits in der Library!' };
  }

  const submission: Omit<SupplementSubmission, 'id' | 'created_at'> = {
    ...suggestion,
    submitted_by: userId,
    status: 'pending',
  };

  const { data, error } = await supabase
    .from('supplement_submissions')
    .insert(submission)
    .select('id')
    .single();

  if (error) {
    console.error('Error submitting supplement:', error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}

/**
 * Get all pending supplement submissions (for admin review)
 */
export async function getPendingSubmissions(): Promise<SupplementSubmission[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('supplement_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching submissions:', error);
    return [];
  }

  return data || [];
}

/**
 * Get submissions by user
 */
export async function getUserSubmissions(userId: string): Promise<SupplementSubmission[]> {
  if (!isSupabaseConfigured || !supabase) return [];

  const { data, error } = await supabase
    .from('supplement_submissions')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user submissions:', error);
    return [];
  }

  return data || [];
}

/**
 * Approve a supplement submission (admin only)
 */
export async function approveSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  const { error } = await supabase
    .from('supplement_submissions')
    .update({ status: 'approved' })
    .eq('id', submissionId);

  if (error) {
    console.error('Error approving submission:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Reject a supplement submission (admin only)
 */
export async function rejectSubmission(submissionId: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase nicht konfiguriert' };
  }

  const { error } = await supabase
    .from('supplement_submissions')
    .update({ status: 'rejected' })
    .eq('id', submissionId);

  if (error) {
    console.error('Error rejecting submission:', error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

