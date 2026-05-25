import { StyleSheet, Text, View } from 'react-native'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors } from '@/design/tokens'
import type { KingdomPinZoomStyle } from '@/features/map/kingdom-pin-zoom'

const PIN_FULL = 46

interface KingdomMapPinProps {
  kingdom: KingdomKey
  zoomStyle: KingdomPinZoomStyle
  isGuideTarget?: boolean
}

function darkenHex(hex: string, amount = 45): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function KingdomMapPin({ kingdom, zoomStyle, isGuideTarget = false }: KingdomMapPinProps) {
  const { size, emojiOpacity, ringWidth, haloOpacity, shadowOpacity } = zoomStyle
  if (size <= 0) return null

  const { bg, emoji } = KINGDOM[kingdom]
  const border = darkenHex(bg)
  const scale = size / PIN_FULL
  const emojiFontSize = Math.max(10, Math.round(size * 0.44))
  const haloSize = size + Math.round(10 * scale)

  return (
    <View style={[styles.wrap, { width: haloSize, height: haloSize }]}>
      {isGuideTarget ? (
        <View
          style={[
            styles.guideRing,
            {
              width: haloSize + 14,
              height: haloSize + 14,
              borderRadius: (haloSize + 14) / 2,
            },
          ]}
        />
      ) : null}
      {haloOpacity > 0.04 ? (
        <View
          style={[
            styles.halo,
            {
              width: haloSize,
              height: haloSize,
              borderRadius: haloSize / 2,
              opacity: haloOpacity,
            },
          ]}
        />
      ) : null}
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            borderColor: emojiOpacity > 0.35 ? colors.card : border,
            borderWidth: ringWidth,
            shadowOpacity,
          },
        ]}>
        {emojiOpacity > 0.05 ? (
          <Text
            style={[
              styles.emoji,
              {
                fontSize: emojiFontSize,
                lineHeight: emojiFontSize + 4,
                opacity: emojiOpacity,
              },
            ]}>
            {emoji}
          </Text>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: colors.greenLight,
    backgroundColor: 'transparent',
  },
  halo: {
    position: 'absolute',
    backgroundColor: colors.ink,
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 5,
  },
  emoji: {
    textAlign: 'center',
  },
})
