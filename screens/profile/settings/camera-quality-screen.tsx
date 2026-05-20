import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import {
  CAMERA_QUALITY_OPTIONS,
  type CameraQuality,
  loadSettingsPreferences,
  saveCameraQuality,
} from '@/features/settings/preferences'

export function CameraQualityScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState<CameraQuality>('high')

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    setValue(prefs.cameraQuality)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: CameraQuality) => {
    setValue(next)
    await saveCameraQuality(next)
  }

  return (
    <SettingsDetailShell title="Camera quality" onBack={() => router.back()} sectionLabel="RESOLUTION">
      <SettingsOptionGroup
        options={CAMERA_QUALITY_OPTIONS}
        value={value}
        onSelect={(next) => void handleSelect(next)}
      />
    </SettingsDetailShell>
  )
}
