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

const CHEST_GRADIENT = [colors.grapeLight, colors.grape, colors.grapeDeep] as const
const TILE_GRADIENT = ['rgba(255,255,255,0.42)', 'rgba(255,255,255,0.10)'] as const
const CONFETTI = [
  { top: '18%', left: '14%', color: colors.gold, size: 6 },
  { top: '70%', left: '34%', color: '#5FD0A8', size: 5 },
  { top: '14%', left: '60%', color: '#FF8FB1', size: 6 },
  { top: '64%', left: '82%', color: colors.gold, size: 5 },
  { top: '26%', left: '90%', color: colors.card, size: 4 },
] as const

export function DailyChestCard({ onOpen }: { onOpen: () => void }) {
  const wobble = useSharedValue(0)
  useEffect(() => {
    wobble.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [wobble])
  const giftStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${-7 + wobble.value * 14}deg` }],
  }))

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open daily chest"
      onPress={onOpen}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={CHEST_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        {CONFETTI.map((c, i) => (
          <View
            key={i}
            style={[
              styles.confetti,
              { top: c.top, left: c.left, width: c.size, height: c.size, backgroundColor: c.color },
            ]}
          />
        ))}

        <LinearGradient colors={TILE_GRADIENT} style={styles.giftTile}>
          <Text style={styles.sparkleTopRight}>✨</Text>
          <Text style={styles.sparkleBottomLeft}>✨</Text>
          <Animated.Text style={[styles.gift, giftStyle]}>🎁</Animated.Text>
        </LinearGradient>

        <View style={styles.text}>
          <Text style={styles.eyebrow}>{"TODAY'S SURPRISE"}</Text>
          <Text style={styles.title}>A rare card awaits!</Text>
          <Text style={styles.sub}>XP · badges · rare cards 🦖</Text>
        </View>

        <View style={styles.openShadow}>
          <Text style={styles.openText}>OPEN</Text>
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: space[16],
  },
  pressed: {
    transform: [{ translateY: 2 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    borderRadius: radius.xxl,
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    overflow: 'hidden',
    shadowColor: colors.grapeDeep,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.42,
    shadowRadius: 22,
    elevation: 10,
  },
  confetti: {
    position: 'absolute',
    borderRadius: radius.pill,
    opacity: 0.85,
  },
  giftTile: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleTopRight: {
    position: 'absolute',
    top: -4,
    right: -2,
    fontSize: 13,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    fontSize: 11,
  },
  gift: {
    fontSize: 36,
  },
  text: {
    flex: 1,
  },
  eyebrow: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.2,
    color: '#FFE6A0',
  },
  title: {
    marginTop: space[4],
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  sub: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: 'rgba(255,255,255,0.82)',
  },
  openShadow: {
    backgroundColor: '#D6BDFF',
    borderRadius: radius.sm,
    paddingBottom: 4,
  },
  openText: {
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.grape,
    overflow: 'hidden',
  },
})
