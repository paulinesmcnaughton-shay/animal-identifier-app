import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import {
  APPEARANCE_OPTIONS,
  type AppearanceMode,
  loadSettingsPreferences,
  saveAppearance,
} from '@/features/settings/preferences'

export function AppearanceScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState<AppearanceMode>('light')

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    setValue(prefs.appearance)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: AppearanceMode) => {
    setValue(next)
    await saveAppearance(next)
  }

  return (
    <SettingsDetailShell title="Appearance" onBack={() => router.back()} sectionLabel="THEME">
      <SettingsOptionGroup
        options={APPEARANCE_OPTIONS}
        value={value}
        onSelect={(next) => void handleSelect(next)}
      />
    </SettingsDetailShell>
  )
}
