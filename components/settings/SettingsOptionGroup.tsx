import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface Option<T extends string> {
  value: T
  label: string
  subtitle?: string
}

interface SettingsOptionGroupProps<T extends string> {
  options: Option<T>[]
  value: T
  onSelect: (value: T) => void
}

export function SettingsOptionGroup<T extends string>({
  options,
  value,
  onSelect,
}: SettingsOptionGroupProps<T>) {
  return (
    <View style={styles.group}>
      {options.map((option, index) => {
        const selected = option.value === value
        const isLast = index === options.length - 1
        return (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.row,
              !isLast && styles.rowBorder,
              pressed && styles.rowPressed,
            ]}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{option.label}</Text>
              {option.subtitle ? <Text style={styles.rowSub}>{option.subtitle}</Text> : null}
            </View>
            {selected ? (
              <Ionicons name="checkmark-circle" size={22} color={colors.greenLight} />
            ) : (
              <View style={styles.checkPlaceholder} />
            )}
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
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
  checkPlaceholder: {
    width: 22,
    height: 22,
  },
})
