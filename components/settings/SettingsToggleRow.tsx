import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ToggleSwitch } from '@/design/atoms/ToggleSwitch'
import { colors, space, type as typeTokens } from '@/design/tokens'

interface SettingsToggleRowProps {
  title: string
  subtitle?: string
  value: boolean
  onValueChange: (value: boolean) => void
  isLast?: boolean
}

export function SettingsToggleRow({
  title,
  subtitle,
  value,
  onValueChange,
  isLast,
}: SettingsToggleRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onValueChange(!value)}
      style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && styles.rowPressed]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      <ToggleSwitch value={value} onValueChange={onValueChange} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    gap: space[16],
    backgroundColor: colors.card,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowPressed: {
    backgroundColor: colors.bg,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
  },
  rowSub: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
  },
})
