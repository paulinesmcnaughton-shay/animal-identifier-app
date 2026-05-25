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
  if (!prefs.shareFindings) return 'Not on Nearby map'
  if (!prefs.showUsername) return 'On map · anonymous'
  return 'On map · with username'
}
