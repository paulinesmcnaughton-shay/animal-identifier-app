import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import { colors, space, type as typeTokens } from '@/design/tokens'
import {
  detectDeviceTimezone,
  getUtcOffsetLabel,
  loadTimezone,
  saveTimezone,
  TIMEZONE_OPTIONS,
  TIMEZONE_REGIONS,
  type TimezoneOption,
} from '@/features/settings/timezone-preference'

export function TimezoneScreenContent() {
  const router = useRouter()
  const [value, setValue] = useState(() => detectDeviceTimezone())

  const load = useCallback(async () => {
    setValue(await loadTimezone())
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleSelect = async (next: string) => {
    setValue(next)
    await saveTimezone(next)
  }

  const optionsByRegion = useMemo(() => {
    return TIMEZONE_REGIONS.map(region => ({
      region,
      options: TIMEZONE_OPTIONS.filter(o => o.region === region).map(o => ({
        value: o.value,
        label: o.label,
        subtitle: getUtcOffsetLabel(o.value),
      })),
    }))
  }, [])

  return (
    <SettingsDetailShell title="Timezone" onBack={() => router.back()}>
      {optionsByRegion.map(({ region, options }) => (
        <View key={region} style={styles.regionBlock}>
          <Text style={styles.regionLabel}>{region.toUpperCase()}</Text>
          <SettingsOptionGroup
            options={options}
            value={value}
            onSelect={(next) => void handleSelect(next)}
          />
        </View>
      ))}
    </SettingsDetailShell>
  )
}

const styles = StyleSheet.create({
  regionBlock: {
    gap: space[8],
    marginBottom: space[8],
  },
  regionLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    letterSpacing: 0.5,
    marginLeft: space[4],
  },
})
