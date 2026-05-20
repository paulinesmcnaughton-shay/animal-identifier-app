import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { colors } from '@/design/tokens'

const PULSE_DURATION_MS = 2800
const RING_SIZES = [60, 120, 180] as const
const RING_DELAYS_MS = [0, 900, 1800] as const

interface RadarPulseRingProps {
  size: number
  delayMs: number
}

function RadarPulseRing({ size, delayMs }: RadarPulseRingProps) {
  const scale = useSharedValue(0.45)
  const opacity = useSharedValue(0.55)

  useEffect(() => {
    scale.value = withDelay(
      delayMs,
      withRepeat(withTiming(1, { duration: PULSE_DURATION_MS }), -1, false),
    )
    opacity.value = withDelay(
      delayMs,
      withRepeat(withTiming(0, { duration: PULSE_DURATION_MS }), -1, false),
    )
  }, [delayMs, opacity, scale])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        animatedStyle,
      ]}
    />
  )
}

export function NearbyRadarRings() {
  return (
    <View style={styles.wrap} pointerEvents="none">
      {RING_SIZES.map((size, index) => (
        <RadarPulseRing key={size} size={size} delayMs={RING_DELAYS_MS[index] ?? 0} />
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: `${colors.mapUser}18`,
    borderWidth: 1.5,
    borderColor: `${colors.mapUser}66`,
  },
})
