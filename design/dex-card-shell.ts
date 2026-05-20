import { StyleSheet } from 'react-native'

import { colors } from '@/design/tokens'

/** Hairline border for Wild Dex grid cards, recent finds, and picker species tiles. */
export const dexCardHairline = {
  borderWidth: StyleSheet.hairlineWidth,
  borderColor: colors.hairline,
} as const
