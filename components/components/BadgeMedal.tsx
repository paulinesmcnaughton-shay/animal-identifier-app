import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface BadgeMedalProps {
  label: string
}

export function BadgeMedal({ label }: BadgeMedalProps) {
  return (
    <View style={styles.row}>
      <Ionicons name="ribbon" size={18} color={colors.sun} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
    paddingHorizontal: space[12],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
  },
  label: {
    fontSize: typeTokens.size.caption,
    fontWeight: '600',
    color: colors.ink,
  },
})
