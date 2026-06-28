import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import type { CreatureRosterItem } from '@/features/home/creature-of-week'
import { useReferenceImage } from '@/features/species/use-reference-image'

// Perforated stamp edge — semicircle notches cut into the white shape (radius 7, period 18).
const NOTCH_R = 7
const NOTCH_GAP = 18
const CTA_GRADIENT = ['#2E8B57', '#1E6B41'] as const
const CTA_BEVEL = '#123E28'

interface CreatureStampProps {
  creature: CreatureRosterItem
  isCollected: boolean
  week: number
  year: number
  onInfoPress: () => void
}

export function CreatureStamp({ creature, isCollected, week, year, onInfoPress }: CreatureStampProps) {
  const { id, commonName, scientificName, kingdom, dexNumber, bonusXp, heroImage } = creature
  const router = useRouter()
  const kingdomKey = kingdom.toLowerCase() as KingdomKey
  const { uri, onImageError } = useReferenceImage({
    speciesId: id,
    commonName,
    scientificName,
    kingdom: kingdomKey,
    dexNum: dexNumber,
  })

  const [dim, setDim] = useState({ w: 0, h: 0 })
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setDim((d) => (d.w === width && d.h === height ? d : { w: width, h: height }))
  }
  const stampPath = useMemo(() => scallopPath(dim.w, dim.h), [dim])

  return (
    <View style={styles.stampWrap}>
      <View style={styles.stamp} onLayout={handleLayout}>
        {dim.w > 0 ? (
          <Svg width={dim.w} height={dim.h} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Path d={stampPath} fill={colors.card} />
          </Svg>
        ) : null}
        <View style={styles.photo}>
          <Image
            source={uri ? { uri } : heroImage}
            onError={() => onImageError(uri)}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <View style={styles.kingdomPill}>
            <Text style={styles.kingdomText}>
              {KINGDOM[kingdomKey]?.emoji ?? '🦎'} {kingdom.toUpperCase()}
            </Text>
          </View>
          <View style={styles.featuredPill}>
            <Text style={styles.featuredText}>★ FEATURED</Text>
          </View>
          {isCollected ? (
            <View style={styles.seal}>
              <Text style={styles.sealText}>SPOTTED</Text>
              <Text style={styles.sealText}>· WK {week} ·</Text>
              <Text style={styles.sealText}>{year}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{commonName}</Text>
          <Text style={styles.scientific}>{scientificName}</Text>
          <View style={styles.actions}>
            <View style={styles.ctaShadow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`I saw a ${commonName} — open camera`}
                onPress={() => router.push('/capture/scan' as never)}
                style={({ pressed }) => [styles.ctaPress, pressed && styles.pressedDown]}>
                <LinearGradient
                  colors={CTA_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}>
                  <Ionicons name="camera" size={18} color={colors.card} />
                  <Text style={styles.ctaText}>I SAW ONE!</Text>
                  <Text style={styles.ctaXp}>+{bonusXp} XP</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <View style={styles.infoShadow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`More about ${commonName}`}
                onPress={onInfoPress}
                style={({ pressed }) => [styles.infoBtn, pressed && styles.pressedDown]}>
                <Ionicons name="information-circle-outline" size={22} color={colors.inkGreen} />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}

// Even notch centres along an edge, leaving a margin from each corner.
function notchCentres(len: number): number[] {
  const n = Math.max(1, Math.round(len / NOTCH_GAP) - 1)
  const step = len / (n + 1)
  return Array.from({ length: n }, (_, i) => (i + 1) * step)
}

// A rectangle whose four edges are scalloped with inward semicircle notches.
function scallopPath(w: number, h: number): string {
  if (!w || !h) return ''
  const r = NOTCH_R
  const SEG = 6
  let d = 'M 0 0 '
  const run = (centres: number[], point: (c: number, t: number) => [number, number]) => {
    for (const c of centres) {
      for (let k = 0; k <= SEG; k++) {
        const [x, y] = point(c, k / SEG)
        d += `L ${x.toFixed(1)} ${y.toFixed(1)} `
      }
    }
  }
  run(notchCentres(w), (cx, t) => {
    const th = Math.PI * (1 - t)
    return [cx + r * Math.cos(th), r * Math.sin(th)]
  })
  d += `L ${w} 0 `
  run(notchCentres(h), (cy, t) => {
    const a = Math.PI * t
    return [w - r * Math.sin(a), cy - r * Math.cos(a)]
  })
  d += `L ${w} ${h} `
  run(notchCentres(w).reverse(), (cx, t) => {
    const b = Math.PI * t
    return [cx + r * Math.cos(b), h - r * Math.sin(b)]
  })
  d += `L 0 ${h} `
  run(notchCentres(h).reverse(), (cy, t) => {
    const g = Math.PI * t
    return [r * Math.sin(g), cy + r * Math.cos(g)]
  })
  return d + 'Z'
}

const styles = StyleSheet.create({
  stampWrap: {
    transform: [{ rotate: '1.5deg' }],
    shadowColor: '#143C1E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },
  stamp: {
    padding: space[24],
  },
  photo: {
    height: 200,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,92,58,0.15)',
  },
  kingdomPill: {
    position: 'absolute',
    left: space[8],
    top: space[8],
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.pill,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  kingdomText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1,
    color: colors.card,
  },
  featuredPill: {
    position: 'absolute',
    right: space[8],
    top: space[8],
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  featuredText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.8,
    color: colors.goldInk,
  },
  seal: {
    position: 'absolute',
    right: space[8],
    bottom: space[8],
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(245,240,225,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-13deg' }],
  },
  sealText: {
    fontSize: 7,
    lineHeight: 10,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.5,
    color: 'rgba(245,240,225,0.92)',
  },
  body: {
    paddingTop: space[24],
  },
  name: {
    fontSize: 19,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.inkGreen,
  },
  scientific: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    fontStyle: 'italic',
    color: colors.muted,
  },
  actions: {
    marginTop: space[16],
    flexDirection: 'row',
    gap: space[8],
  },
  ctaShadow: {
    flex: 1,
    backgroundColor: CTA_BEVEL,
    borderRadius: 16,
    paddingBottom: 4,
  },
  ctaPress: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    paddingVertical: space[16],
  },
  pressedDown: {
    transform: [{ translateY: 4 }],
  },
  ctaText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.3,
    color: colors.card,
  },
  ctaXp: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.gold,
  },
  infoShadow: {
    width: 48,
    backgroundColor: colors.inkGreen,
    borderRadius: 16,
    paddingBottom: 4,
  },
  infoBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.inkGreen,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
