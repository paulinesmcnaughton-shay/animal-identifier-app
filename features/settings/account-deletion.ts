import { getSupabaseClient } from '@/lib/supabase/client'

export async function requestAccountDeletion(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: 'Not connected.' }

  const { error } = await supabase.rpc('request_account_deletion')
  if (error) return { error: error.message }

  return { error: null }
}

export async function restoreAccount(): Promise<{ error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { error: 'Not connected.' }

  const { error } = await supabase.rpc('restore_account')
  if (error) return { error: error.message }

  return { error: null }
}

export async function fetchDeletionScheduledFor(): Promise<Date | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return null

  const { data } = await supabase
    .from('profiles')
    .select('deletion_scheduled_for')
    .eq('id', userId)
    .maybeSingle()

  if (!data?.deletion_scheduled_for) return null
  return new Date(data.deletion_scheduled_for)
}
