import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { type LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import type { CreatureRosterItem } from '@/features/home/creature-of-week'
import { useReferenceImage } from '@/features/species/use-reference-image'

// Perforated stamp edge — bg-coloured circles punched along all four edges.
const NOTCH = 12
const NOTCH_GAP = 18

interface CreatureStampProps {
  creature: CreatureRosterItem
  isCollected: boolean
  weekLabel: string
  onInfoPress: () => void
}

export function CreatureStamp({ creature, isCollected, weekLabel, onInfoPress }: CreatureStampProps) {
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

  const bob = useSharedValue(0)
  useEffect(() => {
    bob.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [bob])
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: '1.5deg' }, { translateY: -3 + bob.value * 6 }],
  }))

  const [dim, setDim] = useState({ w: 0, h: 0 })
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout
    setDim((d) => (d.w === width && d.h === height ? d : { w: width, h: height }))
  }
  const notches = useMemo(() => buildNotches(dim.w, dim.h), [dim])

  return (
    <Animated.View style={[styles.stamp, floatStyle]} onLayout={handleLayout}>
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
          <View style={styles.postmark}>
            <Text style={styles.postmarkTop}>✦ SPOTTED ✦</Text>
            <Text style={styles.postmarkWeek}>{weekLabel}</Text>
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
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
              <Ionicons name="camera" size={18} color={colors.card} />
              <Text style={styles.ctaText}>I SAW ONE!</Text>
              <Text style={styles.ctaXp}>+{bonusXp} XP</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`More about ${commonName}`}
            onPress={onInfoPress}
            style={({ pressed }) => [styles.infoBtn, pressed && styles.infoPressed]}>
            <Ionicons name="information-circle-outline" size={22} color={colors.ink} />
          </Pressable>
        </View>
      </View>

      {notches.map((n, i) => (
        <View key={i} pointerEvents="none" style={[styles.notch, { left: n.left, top: n.top }]} />
      ))}
    </Animated.View>
  )
}

function buildNotches(w: number, h: number): { left: number; top: number }[] {
  if (!w || !h) return []
  const out: { left: number; top: number }[] = []
  const cols = Math.max(2, Math.round(w / NOTCH_GAP))
  const rows = Math.max(2, Math.round(h / NOTCH_GAP))
  const stepX = w / cols
  const stepY = h / rows
  const r = NOTCH / 2
  for (let i = 0; i <= cols; i++) {
    const x = i * stepX - r
    out.push({ left: x, top: -r }, { left: x, top: h - r })
  }
  for (let j = 1; j < rows; j++) {
    const y = j * stepY - r
    out.push({ left: -r, top: y }, { left: w - r, top: y })
  }
  return out
}

const styles = StyleSheet.create({
  stamp: {
    backgroundColor: colors.card,
    padding: space[8],
    borderRadius: radius.sm,
    shadowColor: '#143C1E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
  },
  notch: {
    position: 'absolute',
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.bg,
  },
  photo: {
    height: 198,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(30,92,58,0.15)',
  },
  kingdomPill: {
    position: 'absolute',
    left: space[8],
    top: space[8],
    backgroundColor: 'rgba(0,0,0,0.32)',
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
  postmark: {
    position: 'absolute',
    right: space[8],
    bottom: space[8],
    alignItems: 'center',
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderWidth: 2,
    borderColor: colors.coralDeep,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,248,231,0.55)',
    transform: [{ rotate: '-12deg' }],
  },
  postmarkTop: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.2,
    color: colors.coralDeep,
  },
  postmarkWeek: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.black,
    letterSpacing: 0.5,
    color: colors.coralDeep,
  },
  body: {
    paddingHorizontal: space[4],
    paddingTop: space[8],
    paddingBottom: space[8],
  },
  name: {
    fontSize: 19,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  scientific: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
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
    backgroundColor: colors.inkGreen,
    borderRadius: radius.md,
    paddingBottom: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: space[16],
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
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
  infoBtn: {
    width: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoPressed: {
    opacity: 0.6,
  },
})
