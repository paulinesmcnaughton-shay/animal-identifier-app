import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'

export async function pinSighting(sightingId: string, speciesId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return

  await supabase
    .from('user_sightings')
    .update({ is_pinned: false })
    .eq('user_id', userId)
    .eq('species_id', speciesId)

  await supabase
    .from('user_sightings')
    .update({ is_pinned: true })
    .eq('id', sightingId)
    .eq('user_id', userId)

  notifyAccountProfileChanged()
}

export async function unpinSighting(sightingId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return

  await supabase
    .from('user_sightings')
    .update({ is_pinned: false })
    .eq('id', sightingId)
    .eq('user_id', userId)

  notifyAccountProfileChanged()
}
