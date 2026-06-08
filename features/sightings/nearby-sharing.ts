import { notifySightingsChanged } from '@/features/sightings/sightings-events'
import { loadSettingsPreferences } from '@/features/settings/preferences'
import { sharingPrefsFromSightingsVisibility } from '@/features/settings/sightings-sharing-prefs'
import { getSupabaseClient } from '@/lib/supabase/client'

export type NearbyShareIdentity = 'anonymous' | 'public'

/**
 * The user's default identity preference (Settings → Nearby sharing), used only
 * to pre-select anonymous/public in the Confirm Pin sheet. Never auto-publishes.
 */
export async function loadDefaultShareAnonymously(): Promise<boolean> {
  const prefs = await loadSettingsPreferences()
  return !sharingPrefsFromSightingsVisibility(prefs.sightingsVisibility).showUsername
}

export interface ShareSightingArgs {
  userSightingId: string
  identity: NearbyShareIdentity
  /** Confirmed pin coordinates — NOT raw device GPS. */
  latitude: number
  longitude: number
}

/** Is this specific sighting currently live on the Nearby map? */
export async function isUserSightingShared(userSightingId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase || !userSightingId) return false
  const { data } = await supabase
    .from('community_sightings')
    .select('id')
    .eq('source_user_sighting_id', userSightingId)
    .eq('is_deleted', false)
    .is('deleted_at', null)
    .limit(1)
  return (data ?? []).length > 0
}

/**
 * Publish (or re-publish) a single saved sighting to Nearby using its confirmed
 * pin. If a (possibly removed) row already exists for this sighting, it's revived
 * and its pin/identity updated; otherwise a new row is created.
 */
export async function shareUserSighting(args: ShareSightingArgs): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return false

  const { data: sighting } = await supabase
    .from('user_sightings')
    .select('species_id, species_name, kingdom, spotted_at')
    .eq('id', args.userSightingId)
    .eq('user_id', userId)
    .maybeSingle()
  if (!sighting) return false

  const { data: existing } = await supabase
    .from('community_sightings')
    .select('id')
    .eq('source_user_sighting_id', args.userSightingId)
    .limit(1)
    .maybeSingle()

  const fields = {
    species_name: sighting.species_name,
    species_id: sighting.species_id,
    kingdom: sighting.kingdom,
    latitude: args.latitude,
    longitude: args.longitude,
    privacy: args.identity,
    user_id: userId,
    was_user_confirmed_pin: true,
    is_deleted: false,
    deleted_at: null,
  }

  if (existing?.id) {
    await supabase.from('community_sightings').update(fields).eq('id', existing.id)
  } else {
    await supabase.from('community_sightings').insert({
      ...fields,
      report_count: 1,
      spotted_at: sighting.spotted_at,
      source_user_sighting_id: args.userSightingId,
    })
  }

  console.log('COMMUNITY SIGHTING CREATED', {
    sourceUserSightingId: args.userSightingId,
    latitude: args.latitude,
    longitude: args.longitude,
    privacy: args.identity,
    wasUserConfirmedPin: true,
  })
  notifySightingsChanged()
  return true
}

/**
 * Remove a sighting from Nearby WITHOUT deleting it. Soft-deletes the
 * community_sightings row; the sighting stays in user_sightings + Dex + My Sightings.
 */
export async function unshareUserSighting(userSightingId: string): Promise<boolean> {
  const supabase = getSupabaseClient()
  if (!supabase) return false
  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return false

  await supabase
    .from('community_sightings')
    .update({ is_deleted: true, deleted_at: new Date().toISOString() })
    .eq('source_user_sighting_id', userSightingId)
    .eq('user_id', userId)

  console.log('COMMUNITY SIGHTING REMOVED', { sourceUserSightingId: userSightingId })
  notifySightingsChanged()
  return true
}
