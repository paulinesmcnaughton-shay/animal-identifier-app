import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

interface PillProps {
  children: string
  variant?: 'neutral' | 'accent'
}

export function Pill({ children, variant = 'neutral' }: PillProps) {
  return (
    <View style={[styles.pill, variant === 'accent' && styles.pillAccent]}>
      <Text style={[styles.text, variant === 'accent' && styles.textAccent]}>{children}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: space[12],
    paddingVertical: space[6],
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
  },
  pillAccent: {
    backgroundColor: colors.sun,
  },
  text: {
    fontSize: typeTokens.size.caption,
    fontWeight: '600',
    color: colors.ink2,
  },
  textAccent: {
    color: colors.ink,
  },
})
