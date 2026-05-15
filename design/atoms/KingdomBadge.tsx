import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface KingdomBadgeProps {
  label: string
}

export function KingdomBadge({ label }: KingdomBadgeProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    paddingHorizontal: space[10],
    paddingVertical: space[4],
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
  },
  text: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: colors.ink2,
  },
})
