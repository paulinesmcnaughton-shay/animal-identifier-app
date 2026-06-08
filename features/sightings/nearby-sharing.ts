import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'

export type NearbyShareIdentity = 'anonymous' | 'public'

export interface NearbySharingSettings {
  identity: NearbyShareIdentity
  /** Confirmed pin coordinates — NOT raw device GPS. */
  latitude: number
  longitude: number
  radiusMeters?: number | null
}

/**
 * Persist the Confirm Pin result: enables Nearby sharing, records terms
 * acceptance, the chosen identity, and the confirmed (user-adjusted) coordinates.
 * After this, future Add to Collection saves create community_sightings.
 */
export async function saveNearbySharingSettings(settings: NearbySharingSettings): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return

  const termsAcceptedAt = new Date().toISOString()
  await supabase
    .from('profiles')
    .update({
      nearby_sharing_enabled: true,
      location_sharing_active: true,
      nearby_terms_accepted_at: termsAcceptedAt,
      nearby_share_identity: settings.identity,
      confirmed_share_latitude: settings.latitude,
      confirmed_share_longitude: settings.longitude,
      confirmed_share_radius_meters: settings.radiusMeters ?? null,
    })
    .eq('id', userId)

  console.log('CONFIRM PIN SAVED', {
    confirmedLatitude: settings.latitude,
    confirmedLongitude: settings.longitude,
    radiusMeters: settings.radiusMeters ?? null,
    identity: settings.identity,
    termsAcceptedAt,
  })
  notifyAccountProfileChanged()
}

/** Turn Nearby sharing off — future saves are private only. Existing rows remain. */
export async function disableNearbySharing(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return
  const { data } = await supabase.auth.getUser()
  const userId = data.user?.id
  if (!userId) return

  await supabase
    .from('profiles')
    .update({ location_sharing_active: false, nearby_sharing_enabled: false })
    .eq('id', userId)
  notifyAccountProfileChanged()
}
