import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SightingsSharingFields } from '@/components/settings/SightingsSharingFields'
import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import {
  loadSettingsPreferences,
  saveSightingsVisibility,
  type SightingsVisibility,
} from '@/features/settings/preferences'
import {
  sharingPrefsFromSightingsVisibility,
  sightingsVisibilityFromSharingPrefs,
} from '@/features/settings/sightings-sharing-prefs'

export function SightingsVisibilityScreenContent() {
  const router = useRouter()
  const [shareFindings, setShareFindings] = useState(true)
  const [showUsername, setShowUsername] = useState(true)

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    const sharing = sharingPrefsFromSightingsVisibility(prefs.sightingsVisibility)
    setShareFindings(sharing.shareFindings)
    setShowUsername(sharing.showUsername)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const persist = async (nextShare: boolean, nextShowName: boolean) => {
    const visibility: SightingsVisibility = sightingsVisibilityFromSharingPrefs(
      nextShare,
      nextShowName,
    )
    await saveSightingsVisibility(visibility)
  }

  const handleShareFindingsChange = (next: boolean) => {
    setShareFindings(next)
    const nextShowName = next ? showUsername : false
    if (!next) setShowUsername(false)
    void persist(next, nextShowName)
  }

  const handleShowUsernameChange = (next: boolean) => {
    setShowUsername(next)
    void persist(shareFindings, next)
  }

  return (
    <SettingsDetailShell
      title="Nearby map sharing"
      onBack={() => router.back()}
      sectionLabel="NEARBY MAP">
      <SightingsSharingFields
        shareFindings={shareFindings}
        showUsername={showUsername}
        onShareFindingsChange={handleShareFindingsChange}
        onShowUsernameChange={handleShowUsernameChange}
        variant="settings"
      />
    </SettingsDetailShell>
  )
}
