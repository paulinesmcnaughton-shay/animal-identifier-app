import { getSupabaseClient } from '@/lib/supabase/client'

export interface WaitlistResult {
  ok: boolean
  message: string
}

// Adds an email to the Wildpanion launch waitlist. A duplicate email is treated
// as success — the user is already on the list. Insert-only by RLS; the client
// never reads the list back.
export async function joinWildpanionWaitlist(email: string): Promise<WaitlistResult> {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false, message: 'Something went wrong. Try again.' }

  const { error } = await supabase
    .from('wildpanion_waitlist')
    .insert({ email: email.toLowerCase() })

  if (error) {
    if (error.code === '23505') return { ok: true, message: '' }
    return { ok: false, message: 'Could not save your email. Try again.' }
  }
  return { ok: true, message: '' }
}
