import { clearPendingPassword } from '@/lib/onboarding/pending-signup'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

const ONBOARDING_STORAGE_KEYS = [
  'onboarding.method',
  'onboarding.email',
  'onboarding.username',
  'onboarding.pending',
  'onboarding.date_of_birth',
  'onboarding.account_type',
  'onboarding.parent_name',
  'onboarding.parent_email',
  'onboarding.parent_permission_confirmed',
  'onboarding.requires_parent_setup',
  'profile.onboarding_complete',
] as const

/**
 * Deletes the current auth user's incomplete profile row and signs them out.
 * Only runs in development — no-op in production.
 * Use this to reset an OAuth user who started signup but never finished.
 */
export async function devCleanupUnfinishedOAuthUser(): Promise<void> {
  if (!__DEV__) return

  const supabase = getSupabaseClient()
  if (!supabase) return

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.log('[DevCleanup] No authenticated user found.')
    return
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile || !profile.onboarding_complete) {
    const { error } = await supabase.from('profiles').delete().eq('id', user.id)
    if (error) console.warn('[DevCleanup] Profile delete failed:', error.message)
    else console.log('[DevCleanup] Incomplete profile row deleted.')
  } else {
    console.log('[DevCleanup] Profile is complete — skipping delete.')
  }

  await Promise.all(ONBOARDING_STORAGE_KEYS.map((key) => storage.delete(key)))
  clearPendingPassword()

  await supabase.auth.signOut()
  console.log('[DevCleanup] Signed out. User is fully reset.')
}
