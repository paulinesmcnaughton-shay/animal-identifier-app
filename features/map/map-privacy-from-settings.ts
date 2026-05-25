import type { SightingMapPrivacy } from '@/features/map/sighting-privacy'
import type { SightingsVisibility } from '@/features/settings/preferences'

/** Maps account visibility preference to community_sightings.privacy. */
export function mapPrivacyFromSettings(visibility: SightingsVisibility): SightingMapPrivacy {
  if (visibility === 'public') return 'public'
  if (visibility === 'anonymous') return 'anonymous'
  return 'private'
}

/** Legacy stored value before anonymous replaced friends-only. */
export function normalizeSightingsVisibility(raw: string): SightingsVisibility {
  if (raw === 'friends') return 'anonymous'
  if (raw === 'public' || raw === 'anonymous' || raw === 'private') return raw
  return 'public'
}
