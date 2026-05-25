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

/**
 * Profile (and app-wide) baseline: primary text must not start above this Y from the
 * physical top of the screen. Map sheets and overlays use mapTopOverlayBottom, which
 * is always >= this value.
 */
export function primaryContentTopY(safeAreaTop: number): number {
  return contentTopInset(safeAreaTop)
}
