import { useEffect } from 'react'
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

function TwinkleStar({ style, delay = 0, size = 16, color = colors.sun }: {
  style: ViewStyle
  delay?: number
  size?: number
  color?: string
}) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.2, { duration: 600 }),
        withTiming(1, { duration: 400 }),
        withTiming(0, { duration: 800 }),
      ), -1, false
    ))
    scale.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.7, { duration: 600 }),
        withTiming(1.1, { duration: 400 }),
        withTiming(0.3, { duration: 800 }),
      ), -1, false
    ))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }))

  return (
    <Animated.View style={[styles.star, style, animStyle]}>
      <StarShape size={size} color={color} />
    </Animated.View>
  )
}

function StarShape({ size, color }: { size: number; color: string }) {
  const arm = size * 0.45
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size * 0.12, height: size, borderRadius: size * 0.06, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: size, height: size * 0.12, borderRadius: size * 0.06, backgroundColor: color }} />
      <View style={{ position: 'absolute', width: size * 0.1, height: arm, borderRadius: size * 0.05, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
      <View style={{ position: 'absolute', width: arm, height: size * 0.1, borderRadius: size * 0.05, backgroundColor: color, transform: [{ rotate: '45deg' }] }} />
    </View>
  )
}

interface SnapSlideProps {
  insets: EdgeInsets
  onContinue: () => void
  onSkip: () => void
  displayFont: string
  bodyFont: string
  bodyBoldFont: string
  slideHeight: number
}

export function SnapSlide({ insets, onContinue, onSkip, displayFont, bodyFont, bodyBoldFont, slideHeight }: SnapSlideProps) {
  const bottomPad = Math.max(insets.bottom, 50)
  const imgTop = insets.top + 80

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.skipWrap, { top: insets.top + 16 }]}>
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <TwinkleStar delay={0}    size={18} color={colors.sun}   style={{ top: imgTop + 20,  left: 28 }} />
      <TwinkleStar delay={700}  size={12} color={colors.green} style={{ top: imgTop + 60,  right: 32 }} />
      <TwinkleStar delay={300}  size={22} color={colors.sun}   style={{ top: imgTop + 10,  right: 70 }} />
      <TwinkleStar delay={1000} size={10} color={colors.lime}  style={{ top: imgTop + 120, left: 20 }} />
      <TwinkleStar delay={500}  size={14} color={colors.sun}   style={{ top: imgTop + 200, right: 24 }} />
      <TwinkleStar delay={200}  size={20} color={colors.green} style={{ top: imgTop + 240, left: 36 }} />
      <TwinkleStar delay={800}  size={10} color={colors.lime}  style={{ top: imgTop + 160, right: 56 }} />
      <TwinkleStar delay={1200} size={16} color={colors.sun}   style={{ top: imgTop + 290, left: 60 }} />

      <View style={[styles.main, { paddingTop: imgTop }]}>
        <Image
          source={require('@/assets/images/Scan_onboarding_image.png')}
          style={styles.illustration}
          resizeMode="contain"
        />

        <View style={styles.copy}>
          <Text style={[styles.headline, { fontFamily: displayFont }]}>
            Snap any critter.{'\n'}Know it instantly.
          </Text>
          <Text style={[styles.body, { fontFamily: bodyFont }]}>
            Point your camera at <Text style={{ fontFamily: bodyBoldFont, color: colors.green }}>any animal or insect</Text> and Wildr identifies the species in seconds.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad + 44 }]}>
        <View style={styles.ctaWrap}>
          <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Continue" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space[24],
  },
  skipWrap: {
    position: 'absolute',
    right: space[24],
    zIndex: 4,
  },
  skip: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  star: {
    position: 'absolute',
    zIndex: 1,
  },
  main: {
    alignItems: 'center',
    gap: space[24],
    zIndex: 2,
  },
  illustration: {
    width: 300,
    height: 300,
  },
  copy: {
    paddingHorizontal: space[12],
    alignItems: 'center',
    gap: space[12],
  },
  headline: {
    fontSize: typeTokens.size.displayLG,
    lineHeight: 38,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  body: {
    fontSize: typeTokens.size.bodyLG,
    lineHeight: 25.5,
    color: colors.ink2,
    textAlign: 'center',
    fontWeight: typeTokens.body.weights.medium,
  },
  footer: {
    position: 'absolute',
    left: space[24],
    right: space[24],
    bottom: space[16],
    paddingTop: space[24],
  },
  ctaWrap: {
    backgroundColor: colors.greenDark,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
  },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontWeight: typeTokens.display.weight,
  },
})
