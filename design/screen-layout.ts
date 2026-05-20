import { space } from '@/design/tokens'

/** Horizontal inset and header metrics — map search bar sets top alignment. */
export const screenLayout = {
  padH: space[16],
  /** First header row below safe area (map search bar top). */
  headerTop: space[8],
  headerPadV: space[16],
  iconBtnSize: 40,
  iconSize: 24,
  iconPressedOpacity: 0.6,
} as const

export function contentTopInset(safeAreaTop: number): number {
  return safeAreaTop + screenLayout.headerTop
}
