import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import {
  DISTANCE_UNIT_OPTIONS,
  type DistanceUnit,
  loadDistanceUnit,
  saveDistanceUnit,
} from '@/features/settings/distance-unit'

export function DistanceUnitScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState<DistanceUnit>('miles')

  const load = useCallback(async () => {
    setValue(await loadDistanceUnit())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: DistanceUnit) => {
    setValue(next)
    await saveDistanceUnit(next)
  }

  return (
    <SettingsDetailShell
      title="Distance units"
      onBack={() => router.back()}
      sectionLabel="MEASUREMENTS">
      <SettingsOptionGroup
        options={DISTANCE_UNIT_OPTIONS}
        value={value}
        onSelect={(next) => void handleSelect(next)}
      />
    </SettingsDetailShell>
  )
}
