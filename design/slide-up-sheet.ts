import type { ViewStyle } from 'react-native'

import { colors, radius, shadow } from '@/design/tokens'

/** Shared top corners for all bottom slide-up sheets (map, capture, species info, etc.). */
export const slideUpSheetRadius = {
  borderTopLeftRadius: radius.xxl,
  borderTopRightRadius: radius.xxl,
} as const

export const slideUpSheetHandle: ViewStyle = {
  alignSelf: 'center',
  width: 40,
  height: 4,
  borderRadius: radius.pill,
  backgroundColor: colors.hairline,
}

export function slideUpSheetShell(backgroundColor: string = colors.card): ViewStyle {
  return {
    backgroundColor,
    ...slideUpSheetRadius,
    overflow: 'hidden',
    ...shadow.pop,
  }
}
