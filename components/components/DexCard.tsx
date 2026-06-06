import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { dexCardHairline } from '@/design/dex-card-shell'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useReferenceImage } from '@/features/species/use-reference-image'

export interface DexCardSpecies {
  id: string
  number: string
  name: string
  date: string
  kingdom: KingdomKey
  gradient: readonly [string, string]
  cornerBadge?: 'NEW' | 'RARE'
  showFootprint?: boolean
  /** Scientific name — improves reference-image accuracy and cache keying. */
  latin?: string | null
  /** Pre-resolved reference image from domestic_species registry. Skips external lookup when set. */
  referenceImageUrl?: string | null
}

interface DexCardProps {
  species: DexCardSpecies
  width: number
  onPress?: () => void
  onLongPress?: () => void
  isDeleteMode?: boolean
  onDeletePress?: () => void
}

export function DexCard({
  species,
  width,
  onPress,
  onLongPress,
  isDeleteMode = false,
  onDeletePress,
}: DexCardProps) {
  const { number, name, date, gradient, cornerBadge, kingdom, referenceImageUrl, latin } = species
  const [photoFailed, setPhotoFailed] = useState(false)

  // Domestic dex numbers are prefixed D (e.g. D012 Corgi). The registry image is a
  // DOMESTIC image only — gate it so it can never attach to a wild species.
  const isDomestic = /^#?D\d/.test(number)
  const { uri: displayUri } = useReferenceImage(
    {
      commonName: name,
      scientificName: latin ?? null,
      speciesId: species.id,
      dexNum: number,
      kingdom,
      isDomestic,
      appRegistryImageUrl: isDomestic ? null : referenceImageUrl,
      domesticRegistryImageUrl: isDomestic ? referenceImageUrl : null,
    },
    { screen: 'dex', component: 'DexCard' },
  )

  useEffect(() => {
    setPhotoFailed(false)
  }, [displayUri])

  const showImage = !!displayUri && !photoFailed
  const kingdomBg = KINGDOM[kingdom]?.bg ?? colors.dim

  // Jiggle — each card gets a phase offset so they don't all move in lockstep
  const rotation = useSharedValue(0)
  const phaseMs = (species.id.charCodeAt(0) % 4) * 70

  useEffect(() => {
    if (isDeleteMode) {
      rotation.value = withDelay(
        phaseMs,
        withRepeat(
          withSequence(
            withTiming(-2, { duration: 90 }),
            withTiming(2, { duration: 90 }),
          ),
          -1,
          true,
        ),
      )
    } else {
      cancelAnimation(rotation)
      rotation.value = withSpring(0, { damping: 15, stiffness: 200 })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeleteMode])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }))

  const inner = (
    <Animated.View style={animStyle}>
      <View style={[styles.card, { width }]}>
        <View style={[styles.artWrap, { backgroundColor: kingdomBg }]}>
          {showImage ? (
            <Image
              source={{ uri: displayUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              onError={(e) => {
                console.log('IMAGE FAILED', displayUri, e)
                setPhotoFailed(true)
              }}
            />
          ) : (
            <>
              <LinearGradient
                colors={[...gradient]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.silhouette}>
                <Text style={styles.kingdomEmoji}>{KINGDOM[kingdom]?.emoji ?? '🌿'}</Text>
              </View>
            </>
          )}

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.45)']}
            style={styles.bottomOverlay}
            pointerEvents="none">
            <View style={styles.metaRow}>
              <Text style={styles.number}>{number}</Text>
              <Ionicons name="leaf-outline" size={14} color="rgba(255,255,255,0.85)" />
            </View>
          </LinearGradient>

          {cornerBadge ? (
            <View style={[styles.cornerPill, cornerBadge === 'NEW' ? styles.pillNew : styles.pillRare]}>
              <Text style={styles.cornerPillText}>{cornerBadge}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          {date ? <Text style={styles.date} numberOfLines={1}>{date}</Text> : null}
        </View>
      </View>

      {isDeleteMode && onDeletePress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove ${name} from collection`}
          onPress={onDeletePress}
          hitSlop={8}
          style={styles.deleteBtn}>
          <Ionicons name="close" size={11} color={colors.card} />
        </Pressable>
      ) : null}
    </Animated.View>
  )

  if (!onPress && !onLongPress) return inner

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${number}`}
      onPress={isDeleteMode ? undefined : onPress}
      onLongPress={onLongPress}
      delayLongPress={700}
      style={({ pressed }) => [pressed && !isDeleteMode && styles.cardPressed]}>
      {inner}
    </Pressable>
  )
}

interface DexUnknownCardProps {
  width: number
}

export function DexUnknownCard({ width }: DexUnknownCardProps) {
  return (
    <View style={[styles.card, { width }]}>
      <LinearGradient
        colors={['#C5CCD6', '#9AA5B5']}
        style={[styles.artWrap, styles.unknownInner]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.question}>?</Text>
        <Text style={styles.numberMuted}>#005</Text>
      </LinearGradient>
      <View style={styles.footer}>
        <Text style={styles.name}>Unknown</Text>
      </View>
    </View>
  )
}

const ART_HEIGHT = 112

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...dexCardHairline,
    ...shadow.card,
  },
  artWrap: {
    height: ART_HEIGHT,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  silhouette: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kingdomEmoji: {
    fontSize: 36,
    textAlign: 'center',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#C5CCD6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space[8],
    paddingTop: space[16],
    paddingBottom: space[8],
    justifyContent: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  cornerPill: {
    position: 'absolute',
    top: space[8],
    left: space[8],
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  pillNew: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pillRare: {
    backgroundColor: 'rgba(255,201,60,0.95)',
  },
  cornerPillText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  unknownInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
  },
  question: {
    fontSize: 48,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.75)',
  },
  numberMuted: {
    fontSize: typeTokens.size.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    gap: space[4],
  },
  name: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.ink,
  },
  date: {
    fontSize: typeTokens.size.caption,
    fontWeight: '500',
    color: colors.dim,
  },
  deleteBtn: {
    position: 'absolute',
    top: -7,
    right: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
    zIndex: 10,
  },
})
