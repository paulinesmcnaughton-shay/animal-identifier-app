import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

export const lightTheme = {
  colors,
  radius,
  space,
  type: typeTokens,
  scheme: 'light' as const,
}

export const darkTheme = {
  ...lightTheme,
  scheme: 'dark' as const,
  colors: {
    ...colors,
    bg: '#152130',
    bg2: '#1a2838',
    card: '#243044',
    ink: '#FFFBF0',
    ink2: '#E7EDF3',
    dim: '#8BA5BC',
    hairline: '#33455A',
  },
}

export type WildrTheme = typeof lightTheme
