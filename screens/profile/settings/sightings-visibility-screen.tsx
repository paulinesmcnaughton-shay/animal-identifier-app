import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import {
  SIGHTINGS_VISIBILITY_OPTIONS,
  type SightingsVisibility,
  loadSettingsPreferences,
  saveSightingsVisibility,
} from '@/features/settings/preferences'

export function SightingsVisibilityScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState<SightingsVisibility>('public')

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    setValue(prefs.sightingsVisibility)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: SightingsVisibility) => {
    setValue(next)
    await saveSightingsVisibility(next)
  }

  return (
    <SettingsDetailShell
      title="Sightings visibility"
      onBack={() => router.back()}
      sectionLabel="WHO CAN SEE YOUR SPOTS">
      <SettingsOptionGroup
        options={SIGHTINGS_VISIBILITY_OPTIONS}
        value={value}
        onSelect={(next) => void handleSelect(next)}
      />
    </SettingsDetailShell>
  )
}
