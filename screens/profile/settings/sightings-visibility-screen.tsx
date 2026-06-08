import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SightingsSharingFields } from '@/components/settings/SightingsSharingFields'
import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { loadSettingsPreferences, saveSightingsVisibility } from '@/features/settings/preferences'
import {
  sharingPrefsFromSightingsVisibility,
  sightingsVisibilityFromSharingPrefs,
} from '@/features/settings/sightings-sharing-prefs'

export function SightingsVisibilityScreenContent() {
  const router = useRouter()
  const [showUsername, setShowUsername] = useState(true)

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    const sharing = sharingPrefsFromSightingsVisibility(prefs.sightingsVisibility)
    setShowUsername(sharing.showUsername)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleShowUsernameChange = (next: boolean) => {
    setShowUsername(next)
    // Identity-only preference: sharing itself is per-sighting via the GPS icon.
    // 'public' = username shown by default, 'anonymous' = anonymous by default.
    void saveSightingsVisibility(sightingsVisibilityFromSharingPrefs(true, next))
  }

  return (
    <SettingsDetailShell
      title="Nearby sharing"
      onBack={() => router.back()}
      sectionLabel="NEARBY MAP">
      <SightingsSharingFields
        showUsername={showUsername}
        onShowUsernameChange={handleShowUsernameChange}
      />
    </SettingsDetailShell>
  )
}
