import type { ReactNode } from 'react'
import { StyleSheet, View, type ViewProps } from 'react-native'

import { colors, radius, shadow, space } from '@/design/tokens'

interface CardProps extends ViewProps {
  children: ReactNode
}

export function Card({ children, style, ...rest }: CardProps) {
  return (
    <View style={[styles.card, style]} {...rest}>
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space[16],
    ...shadow.card,
  },
})
