import React from 'react'
import { Pressable, StyleSheet, Text, type PressableProps, type TextStyle, type ViewStyle } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string
  variant?: 'primary' | 'secondary'
  style?: ViewStyle | ViewStyle[]
  textStyle?: TextStyle
}

export function Button({ label, variant = 'primary', style, textStyle, ...rest }: ButtonProps) {
  const isPrimary = variant === 'primary'
  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.base,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        style,
      ]}
      {...rest}>
      <Text style={[styles.label, isPrimary ? styles.labelOnPrimary : styles.labelOnSecondary, textStyle]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: space[12],
    paddingHorizontal: space[20],
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.green,
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  pressed: {
    opacity: 0.88,
  },
  label: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
  },
  labelOnPrimary: {
    color: colors.card,
  },
  labelOnSecondary: {
    color: colors.ink,
  },
})
