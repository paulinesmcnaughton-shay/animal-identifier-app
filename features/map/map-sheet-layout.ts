import { contentTopInset, primaryContentTopY } from '@/design/screen-layout'
import { colors, space, type as typeTokens } from '@/design/tokens'

/** Matches map search bar: paddingVertical ×2 + single-line input. */
export const MAP_SEARCH_BAR_HEIGHT = 40

/** Matches toggle pill: outer padding + option row. */
export const MAP_TOGGLE_ROW_HEIGHT = 44

/** Gap between search bar and sightings / nearby toggle. */
export const MAP_GAP_BELOW_SEARCH = space[8]

/** Visible map strip between top overlay and expanded nearby detail sheet. */
export const MAP_GAP_ABOVE_NEARBY_DETAIL = space[16]

/** Default sheet height for list / my sightings (not full chrome). */
export const MAP_SHEET_HEIGHT_DEFAULT = 380

/** Y from screen top where the nearby detail sheet should stop (below search + toggle). */
export function mapTopOverlayBottom(safeAreaTop: number): number {
  return (
    contentTopInset(safeAreaTop)
    + MAP_SEARCH_BAR_HEIGHT
    + MAP_GAP_BELOW_SEARCH
    + MAP_TOGGLE_ROW_HEIGHT
    + MAP_GAP_ABOVE_NEARBY_DETAIL
  )
}

export function nearbyDetailSheetHeight(windowHeight: number, safeAreaTop: number): number {
  return Math.max(MAP_SHEET_HEIGHT_DEFAULT, windowHeight - mapTopOverlayBottom(safeAreaTop))
}

/** Drag handle (4px) + margin below — shared by list and detail sheets. */
export const MAP_SHEET_HANDLE_BLOCK_HEIGHT = 4 + space[16]

/**
 * Fixed header row under the handle (back link, sheet title, close).
 * Matches map side-button touch height so content scrolls beneath a consistent band.
 */
export const MAP_SHEET_HEADER_ROW_MIN_HEIGHT = 44

/** Padding before the first line of scrollable sheet body (below fixed header). */
export const MAP_SHEET_SCROLL_TOP_PADDING = space[16]

/**
 * Walk preview collapsed peek — handle through distance meta (e.g. “1.3 mi · Sidewalk route”).
 * Sheet stops here when dragged down; directions stay hidden until user slides up.
 */
export const WALK_PREVIEW_SUMMARY_PEEK_BODY =
  MAP_SHEET_HANDLE_BLOCK_HEIGHT
  + space[8]
  + MAP_SHEET_HEADER_ROW_MIN_HEIGHT
  + space[8]
  + MAP_SHEET_SCROLL_TOP_PADDING
  + typeTokens.size.title
  + space[8]
  + typeTokens.size.displaySM
  + space[8]
  + typeTokens.size.bodySM
  + space[16]

/** Sheet top edge when expanded — never above map search / toggle chrome. */
export function mapExpandedSheetTopY(safeAreaTop: number): number {
  return mapTopOverlayBottom(safeAreaTop)
}

/** Body text scales aligned with Profile (no displayXL/LG in sheet scroll). */
export const mapSheetTextStyles = {
  speciesName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  duration: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  meta: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
} as const

export { primaryContentTopY }
