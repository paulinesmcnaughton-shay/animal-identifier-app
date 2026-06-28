import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const CARD_GRADIENT = ['#54B16E', '#2E8B57', '#1E6B41'] as const
const SHINE_GRADIENT = ['transparent', 'rgba(255,255,255,0.22)', 'transparent'] as const
const DOTS = [
  { top: '24%', left: '14%', size: 6, color: colors.gold },
  { top: '80%', left: '40%', size: 5, color: '#BDF0C6' },
  { top: '16%', left: '63%', size: 5, color: colors.card },
  { top: '60%', left: '92%', size: 4, color: colors.gold },
] as const

const buddyImage = require('@/assets/images/wildpanion-buddy.png')

export function WildpanionCard({ onPress }: { onPress?: () => void }) {
  const sweep = useSharedValue(0)
  const pulse = useSharedValue(0)
  const breathe = useSharedValue(1)
  useEffect(() => {
    sweep.value = withRepeat(withTiming(1, { duration: 4600, easing: Easing.inOut(Easing.ease) }), -1, false)
    pulse.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.ease) }), -1, false)
    breathe.value = withRepeat(withTiming(1.06, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true)
  }, [sweep, pulse, breathe])

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -160 + sweep.value * 620 }, { skewX: '-18deg' }],
  }))
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.9 }],
  }))
  const sparkleStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open Wildpanion"
      onPress={onPress}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        <View pointerEvents="none" style={styles.bigDot} />
        {DOTS.map((d, i) => (
          <View
            key={i}
            pointerEvents="none"
            style={[styles.dot, { top: d.top, left: d.left, width: d.size, height: d.size, backgroundColor: d.color }]}
          />
        ))}
        <Animated.View pointerEvents="none" style={[styles.shine, shineStyle]}>
          <LinearGradient colors={SHINE_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <View style={styles.avatar}>
          <Animated.Text style={[styles.sparkle, sparkleStyle]}>✨</Animated.Text>
          <Image source={buddyImage} style={styles.buddy} contentFit="contain" />
        </View>

        <View style={styles.body}>
          <Text style={styles.kicker}>YOUR BUDDY AWAITS</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>COMING SOON</Text>
          </View>
          <Text style={styles.title}>Wildpanion</Text>
          <Text style={styles.sub}>Feed, play &amp; watch it grow 🐾</Text>
        </View>

        <View style={styles.chev}>
          <Animated.View pointerEvents="none" style={[styles.chevRing, ringStyle]} />
          <Ionicons name="chevron-forward" size={18} color="#1E6B41" />
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {},
  pressed: {
    transform: [{ translateY: 2 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    borderRadius: 24,
    padding: space[16],
    overflow: 'hidden',
    shadowColor: '#1E6B41',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 26,
    elevation: 10,
  },
  bigDot: {
    position: 'absolute',
    top: -52,
    right: -28,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dot: {
    position: 'absolute',
    borderRadius: radius.pill,
    opacity: 0.9,
  },
  shine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 60,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkle: {
    position: 'absolute',
    top: -6,
    right: -4,
    fontSize: 14,
    zIndex: 2,
  },
  buddy: {
    width: 56,
    height: 56,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.4,
    color: '#FFE9A8',
  },
  badge: {
    alignSelf: 'flex-start',
    marginTop: space[8],
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  badgeText: {
    fontSize: 8,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.8,
    color: colors.inkGreen,
  },
  title: {
    marginTop: space[8],
    fontSize: 20,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  sub: {
    marginTop: space[8],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: 'rgba(255,255,255,0.82)',
  },
  chev: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.gold,
  },
})
