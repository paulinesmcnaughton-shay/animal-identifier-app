import { useEffect } from 'react'
import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface CollectSlideProps {
  insets: EdgeInsets
  onFinish: () => void
  onSkip: () => void
  displayFont: string
  bodyFont: string
  slideHeight: number
}

export function CollectSlide({ insets, onFinish, onSkip, displayFont, bodyFont, slideHeight }: CollectSlideProps) {
  const bottomPad = Math.max(insets.bottom, 50)
  const floatY = useSharedValue(0)
  const floatX = useSharedValue(0)

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 3000 }),
        withTiming(4, { duration: 3000 }),
      ), -1, true
    )
    floatX.value = withRepeat(
      withSequence(
        withTiming(-2, { duration: 3600 }),
        withTiming(2, { duration: 3600 }),
      ), -1, true
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }, { translateX: floatX.value }],
  }))

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.skipWrap, { top: insets.top + 16 }]}>
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <View style={[styles.topCopy, { paddingTop: insets.top + 80 }]}>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Your Field Guide</Text>
          </View>
        </View>
        <Text style={[styles.headline, { fontFamily: displayFont }]}>
          Build your own{'\n'}Wild Dex.
        </Text>
        <Text style={[styles.body, { fontFamily: bodyFont }]}>
          Earn badges, hit streaks, and collect every creature you spot in the wild.
        </Text>
      </View>

      <Animated.View style={[styles.stageImage, { top: insets.top + 280 }, floatStyle]}>
        <Image
          source={require('@/assets/images/badge-and-cards.png')}
          style={{ width: '100%', height: '100%' }}
          resizeMode="contain"
        />
      </Animated.View>

      <View style={[styles.footer, { paddingBottom: bottomPad + 44 }]}>
        <View style={styles.ctaWrap}>
          <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Lets go" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Let&apos;s go!</Text>
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
  topCopy: {
    position: 'absolute',
    left: space[24],
    right: space[24],
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginBottom: space[16],
  },
  pill: {
    backgroundColor: colors.coral,
    paddingVertical: space[4],
    paddingHorizontal: space[10],
    borderRadius: radius.sm,
  },
  pillText: {
    color: colors.card,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.black,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headline: {
    fontSize: 38,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: 0,
  },
  body: {
    marginTop: space[12],
    fontSize: typeTokens.size.title,
    lineHeight: 24,
    color: colors.ink2,
    fontWeight: typeTokens.body.weights.medium,
  },
  stageImage: {
    position: 'absolute',
    alignSelf: 'center',
    width: 320,
    height: 320,
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
