import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
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

interface CreatureStampProps {
  creature: CreatureRosterItem
  onInfoPress: () => void
}

export function CreatureStamp({ creature, onInfoPress }: CreatureStampProps) {
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

  return (
    <View style={styles.center}>
      <Animated.View style={[styles.stamp, floatStyle]}>
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
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{commonName}</Text>
          <Text style={styles.scientific}>{scientificName}</Text>
          <View style={styles.actions}>
            <View style={styles.ctaShadow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Capture ${commonName}`}
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
      </Animated.View>
    </View>
  )
}

const STAMP_WIDTH = 328

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    marginTop: space[4],
  },
  stamp: {
    width: STAMP_WIDTH,
    backgroundColor: colors.card,
    paddingHorizontal: space[8],
    paddingTop: space[8],
    paddingBottom: space[4],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.hairline,
    borderRadius: radius.sm,
    shadowColor: '#143C1E',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.26,
    shadowRadius: 18,
    elevation: 8,
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
