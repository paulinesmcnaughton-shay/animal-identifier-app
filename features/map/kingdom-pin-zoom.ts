/** Screen-space pin metrics interpolated by map zoom (Find My / AirTag style). */

export interface KingdomPinZoomStyle {
  size: number
  emojiOpacity: number
  ringWidth: number
  haloOpacity: number
  shadowOpacity: number
}

const SIZE_MIN = 9
const SIZE_FULL = 46
const Z_VISIBLE = 8
const Z_GROW_START = 10
const Z_EMOJI_START = 12.8
const Z_FULL = 15.2

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

/** Smooth step between two zoom levels (no abrupt jumps). */
function smoothstep(fromZoom: number, toZoom: number, zoom: number): number {
  const t = clamp01((zoom - fromZoom) / (toZoom - fromZoom))
  return t * t * (3 - 2 * t)
}

export function getKingdomPinZoomStyle(zoom: number): KingdomPinZoomStyle {
  if (zoom < Z_VISIBLE) {
    return {
      size: 0,
      emojiOpacity: 0,
      ringWidth: 0,
      haloOpacity: 0,
      shadowOpacity: 0,
    }
  }

  const growT = smoothstep(Z_GROW_START, Z_FULL, zoom)
  const emojiT = smoothstep(Z_EMOJI_START, Z_FULL, zoom)
  const detailT = smoothstep(Z_FULL - 1.2, Z_FULL + 0.8, zoom)

  const size = SIZE_MIN + growT * (SIZE_FULL - SIZE_MIN)

  return {
    size: Math.round(size),
    emojiOpacity: emojiT,
    ringWidth: 1 + detailT * 2,
    haloOpacity: growT * 0.22,
    shadowOpacity: 0.12 + growT * 0.22,
  }
}
