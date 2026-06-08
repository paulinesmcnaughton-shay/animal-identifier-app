import type { SightingsVisibility } from '@/features/settings/preferences'

export interface SightingsSharingPrefs {
  shareFindings: boolean
  showUsername: boolean
}

export function sightingsVisibilityFromSharingPrefs(
  shareFindings: boolean,
  showUsername: boolean,
): SightingsVisibility {
  if (!shareFindings) return 'private'
  if (!showUsername) return 'anonymous'
  return 'public'
}

export function sharingPrefsFromSightingsVisibility(
  visibility: SightingsVisibility,
): SightingsSharingPrefs {
  if (visibility === 'private') {
    return { shareFindings: false, showUsername: false }
  }
  if (visibility === 'anonymous') {
    return { shareFindings: true, showUsername: false }
  }
  return { shareFindings: true, showUsername: true }
}

export function sightingsVisibilitySummary(visibility: SightingsVisibility): string {
  const prefs = sharingPrefsFromSightingsVisibility(visibility)
  // Sharing is per-sighting now; this preference is only the default identity
  // pre-selected when the user shares a sighting via the GPS icon.
  return prefs.showUsername ? 'Default: username shown' : 'Default: anonymous'
}
