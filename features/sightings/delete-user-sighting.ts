import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function deleteUserSighting(speciesId: string): Promise<{ ok: boolean }> {
  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false }

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return { ok: false }

  const { error } = await supabase
    .from('user_sightings')
    .delete()
    .eq('user_id', userId)
    .eq('species_id', speciesId)

  if (error) return { ok: false }

  const { data: remaining } = await supabase
    .from('user_sightings')
    .select('species_id')
    .eq('user_id', userId)

  const distinctCount = new Set((remaining ?? []).map((r) => r.species_id)).size

  await supabase
    .from('profiles')
    .update({ spots_captured: distinctCount })
    .eq('id', userId)

  notifyAccountProfileChanged()
  return { ok: true }
}
