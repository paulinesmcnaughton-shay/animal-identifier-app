import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import {
  DEX_LAYOUT_OPTIONS,
  type DexLayoutMode,
  loadSettingsPreferences,
  saveDexLayout,
} from '@/features/settings/preferences'

export function DexLayoutScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState<DexLayoutMode>('grid-3')

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    setValue(prefs.dexLayout)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: DexLayoutMode) => {
    setValue(next)
    await saveDexLayout(next)
  }

  return (
    <SettingsDetailShell title="Dex layout" onBack={() => router.back()} sectionLabel="COLLECTION VIEW">
      <SettingsOptionGroup
        options={DEX_LAYOUT_OPTIONS}
        value={value}
        onSelect={(next) => void handleSelect(next)}
      />
    </SettingsDetailShell>
  )
}
