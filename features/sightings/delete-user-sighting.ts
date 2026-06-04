import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'
import { notifySightingsChanged } from './sightings-events'

export async function deleteUserSighting(speciesId: string): Promise<{ ok: boolean }> {
  console.log('DELETE BUTTON PRESSED species id:', speciesId)

  const supabase = getSupabaseClient()
  if (!supabase) return { ok: false }

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return { ok: false }

  // Find active sightings for this species
  const { data: affected, error: selectError } = await supabase
    .from('user_sightings')
    .select('id')
    .eq('user_id', userId)
    .eq('species_id', speciesId)
    .eq('is_deleted', false)

  if (selectError) {
    console.warn('[WildKind] select sightings failed:', selectError.message)
    return { ok: false }
  }

  console.log('SOFT DELETED SIGHTINGS COUNT:', affected?.length ?? 0)

  if ((affected?.length ?? 0) > 0) {
    console.log('CALLING DELETE FUNCTION species id:', speciesId)

    const { error: updateError } = await supabase
      .from('user_sightings')
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('species_id', speciesId)
      .eq('is_deleted', false)

    if (updateError) {
      console.warn('[WildKind] soft-delete failed:', updateError.message)
      return { ok: false }
    }

    console.log('DELETE RESULT: soft-deleted', affected?.length, 'sightings for species', speciesId)
  }

  // Soft-delete the user's community_sightings rows so they are filtered out
  // of Nearby Sightings without permanently removing the data.
  const { data: communityRemoved, error: communityError } = await supabase
    .from('community_sightings')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('species_id', speciesId)
    .eq('is_deleted', false)
    .select('id')

  if (communityError) {
    console.warn('[WildKind] community_sightings delete failed:', communityError.message)
  } else {
    console.log('Nearby Sightings: removed community_sightings rows:', communityRemoved?.length ?? 0)
  }

  // Recount active sightings to keep spots_captured accurate
  const { data: remaining } = await supabase
    .from('user_sightings')
    .select('species_id')
    .eq('user_id', userId)
    .eq('is_deleted', false)

  const distinctCount = new Set((remaining ?? []).map((r) => r.species_id)).size

  await supabase
    .from('profiles')
    .update({ spots_captured: distinctCount })
    .eq('id', userId)

  // Notify Wild Dex + map pins
  notifyAccountProfileChanged()
  // Notify species detail sightings section
  notifySightingsChanged()

  console.log('REFRESH FIRED for species id:', speciesId)

  return { ok: true }
}
