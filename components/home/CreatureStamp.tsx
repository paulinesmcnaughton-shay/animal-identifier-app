import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
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
  isCollected: boolean
  isClaimed: boolean
  weekLabel: string
  onClaim: () => void
  onInfoPress: () => void
}

export function CreatureStamp({
  creature,
  isCollected,
  isClaimed,
  weekLabel,
  onClaim,
  onInfoPress,
}: CreatureStampProps) {
  const { id, commonName, scientificName, kingdom, dexNumber, bonusXp, heroImage } = creature
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

  // CTA unlocks only once the species is in the Dex, then can be claimed once.
  const ctaDisabled = !isCollected || isClaimed
  const iconColor = isClaimed ? colors.card : isCollected ? colors.card : colors.dim

  return (
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
          <View
            style={[
              styles.ctaShadow,
              !isCollected && styles.ctaShadowLocked,
              isClaimed && styles.ctaShadowClaimed,
            ]}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: ctaDisabled }}
              accessibilityLabel={
                isClaimed ? `Bonus collected for ${commonName}` : `Claim bonus for ${commonName}`
              }
              disabled={ctaDisabled}
              onPress={onClaim}
              style={({ pressed }) => [
                styles.cta,
                !isCollected && styles.ctaLocked,
                isClaimed && styles.ctaClaimed,
                pressed && !ctaDisabled && styles.ctaPressed,
              ]}>
              {isClaimed ? (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={iconColor} />
                  <Text style={styles.ctaText}>COLLECTED</Text>
                </>
              ) : (
                <>
                  <Ionicons name="camera" size={18} color={iconColor} />
                  <Text style={[styles.ctaText, !isCollected && styles.ctaTextLocked]}>I SAW ONE!</Text>
                  <Text style={[styles.ctaXp, !isCollected && styles.ctaTextLocked]}>+{bonusXp} XP</Text>
                </>
              )}
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
  )
}

const styles = StyleSheet.create({
  stamp: {
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
  ctaShadowLocked: {
    backgroundColor: colors.hairline,
  },
  ctaLocked: {
    backgroundColor: colors.hairline,
  },
  ctaShadowClaimed: {
    backgroundColor: colors.greenDeep,
  },
  ctaClaimed: {
    backgroundColor: colors.forest,
  },
  ctaText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.3,
    color: colors.card,
  },
  ctaTextLocked: {
    color: colors.dim,
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
