import * as Location from 'expo-location'

import { mapPrivacyFromSettings } from '@/features/map/map-privacy-from-settings'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { loadSettingsPreferences } from '@/features/settings/preferences'
import { getSupabaseClient } from '@/lib/supabase/client'

interface SaveCommunitySightingInput {
  speciesId: string
  speciesName: string
  kingdom: KingdomKey
}

export async function saveCommunitySighting(
  input: SaveCommunitySightingInput,
): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return

  const prefs = await loadSettingsPreferences()
  const privacy = mapPrivacyFromSettings(prefs.sightingsVisibility)

  let latitude = 0
  let longitude = 0

  if (prefs.autoTagLocation) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      }
    } catch {
      return
    }
  }

  if (!latitude && !longitude) return

  const { error } = await supabase.from('community_sightings').insert({
    species_name: input.speciesName,
    species_id: input.speciesId,
    kingdom: input.kingdom,
    latitude,
    longitude,
    privacy,
    user_id: userId,
    report_count: 1,
  })

  if (error && __DEV__) {
    console.warn('[WildKind] community_sightings insert failed:', error.message)
  }
}
