import { StyleSheet } from 'react-native'

import { colors, radius, space } from '@/design/tokens'

/** Map overlay / directions — icon scale per design system (20 = button, 24 = nav emphasis). */
export const WALK_DIRECTIONS_ICON = {
  inline: 20,
  maneuver: 20,
  close: 20,
  recenter: 20,
  start: 20,
  walk: 20,
} as const

/** Minimum touch target (WCAG) for map direction controls. */
export const WALK_DIRECTIONS_TOUCH = 44

export const WALK_DIRECTIONS_EDGE = space[16]
export const WALK_DIRECTIONS_GAP = space[8]
export const WALK_DIRECTIONS_GAP_BLOCK = space[16]

export const walkDirectionsHitSlop = {
  top: WALK_DIRECTIONS_GAP,
  bottom: WALK_DIRECTIONS_GAP,
  left: WALK_DIRECTIONS_GAP,
  right: WALK_DIRECTIONS_GAP,
} as const

export const walkDirectionsIconButton = StyleSheet.create({
  base: {
    width: WALK_DIRECTIONS_TOUCH,
    height: WALK_DIRECTIONS_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
  onDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  onLight: {
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  maneuver: {
    width: WALK_DIRECTIONS_TOUCH,
    height: WALK_DIRECTIONS_TOUCH,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
