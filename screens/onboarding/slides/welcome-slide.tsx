import { LinearGradient } from 'expo-linear-gradient'
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

import { WildrLogo } from '@/components/WildrLogo'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

function FloatingDot({ style, delay = 0, driftY = 7, driftX = 4 }: {
  style: ViewStyle
  delay?: number
  driftY?: number
  driftX?: number
}) {
  const y = useSharedValue(0)
  const x = useSharedValue(0)

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(
      withSequence(
        withTiming(-driftY, { duration: 2800 }),
        withTiming(driftY, { duration: 2800 }),
      ), -1, true
    ))
    x.value = withDelay(delay + 400, withRepeat(
      withSequence(
        withTiming(-driftX, { duration: 3400 }),
        withTiming(driftX, { duration: 3400 }),
      ), -1, true
    ))
  }, [])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { translateX: x.value }],
  }))

  return <Animated.View style={[styles.dot, style, animStyle]} />
}

const WELCOME_TOP = '#FFE89C'
const WELCOME_MID = colors.sun
const WELCOME_END = '#FF9D5C'


interface WelcomeSlideProps {
  insets: EdgeInsets
  onStart: () => void
  onLogin: () => void
  displayFont: string
  bodyFont: string
  slideHeight: number
}

export function WelcomeSlide({ insets, onStart, onLogin, displayFont, bodyFont, slideHeight }: WelcomeSlideProps) {
  const bottomPad = Math.max(insets.bottom, 50)

  return (
    <View style={[styles.flex, { minHeight: slideHeight }]}>
      <LinearGradient
        colors={[WELCOME_TOP, WELCOME_MID, WELCOME_END]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.95, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <FloatingDot delay={0}    driftY={6} driftX={3} style={{ top: insets.top + 80,  left: 28,  width: 8,  height: 8,  borderRadius: 4,  opacity: 0.55 }} />
      <FloatingDot delay={400}  driftY={8} driftX={5} style={{ top: insets.top + 130, right: 44, width: 12, height: 12, borderRadius: 6,  opacity: 0.40 }} />
      <FloatingDot delay={200}  driftY={5} driftX={4} style={{ top: insets.top + 190, left: 65,  width: 6,  height: 6,  borderRadius: 3,  opacity: 0.60 }} />
      <FloatingDot delay={600}  driftY={9} driftX={4} style={{ bottom: 300,           right: 72, width: 14, height: 14, borderRadius: 7,  opacity: 0.35 }} />
      <FloatingDot delay={800}  driftY={6} driftX={6} style={{ top: insets.top + 60,  right: 90, width: 5,  height: 5,  borderRadius: 3,  opacity: 0.30 }} />
      <FloatingDot delay={1000} driftY={7} driftX={3} style={{ top: insets.top + 260, right: 30, width: 7,  height: 7,  borderRadius: 4,  opacity: 0.25 }} />
      <FloatingDot delay={300}  driftY={5} driftX={5} style={{ bottom: 220,           left: 40,  width: 5,  height: 5,  borderRadius: 3,  opacity: 0.30 }} />
      <FloatingDot delay={700}  driftY={8} driftX={3} style={{ top: insets.top + 350, left: 20,  width: 9,  height: 9,  borderRadius: 5,  opacity: 0.20 }} />

      <FloatingDot delay={100}  driftY={6} driftX={4} style={{ bottom: 180, left: 24,   width: 18, height: 18, borderRadius: 9,  opacity: 0.18 }} />
      <FloatingDot delay={500}  driftY={7} driftX={3} style={{ bottom: 120, right: 28,  width: 14, height: 14, borderRadius: 7,  opacity: 0.22 }} />
      <FloatingDot delay={250}  driftY={5} driftX={5} style={{ bottom: 200, right: 60,  width: 8,  height: 8,  borderRadius: 4,  opacity: 0.15 }} />
      <FloatingDot delay={750}  driftY={9} driftX={4} style={{ bottom: 90,  left: 70,   width: 20, height: 20, borderRadius: 10, opacity: 0.12 }} />
      <FloatingDot delay={150}  driftY={6} driftX={6} style={{ bottom: 260, left: 160,  width: 6,  height: 6,  borderRadius: 3,  opacity: 0.20 }} />
      <FloatingDot delay={900}  driftY={8} driftX={3} style={{ bottom: 230, left: 200,  width: 16, height: 16, borderRadius: 8,  opacity: 0.14 }} />
      <FloatingDot delay={450}  driftY={5} driftX={4} style={{ bottom: 290, left: 175,  width: 10, height: 10, borderRadius: 5,  opacity: 0.18 }} />
      <FloatingDot delay={650}  driftY={7} driftX={5} style={{ bottom: 200, left: 145,  width: 24, height: 24, borderRadius: 12, opacity: 0.10 }} />

      <View style={[styles.hero, { top: insets.top + 80 }]}>
        <WildrLogo width={220} />
        <Text style={[styles.tagline, { fontFamily: bodyFont }]}>Your Pocket Field Guide</Text>
      </View>

      <Image
        source={require('@/assets/images/onboarding-cards.png')}
        style={[styles.cardsImage, { top: insets.top + 214 }]}
        resizeMode="contain"
      />

      <LinearGradient
        colors={['rgba(255,157,92,0)', 'rgba(255,157,92,0.85)']}
        locations={[0, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={[styles.footer, { paddingBottom: bottomPad, paddingTop: space[24], paddingHorizontal: space[24] }]}>
        <View style={styles.ctaWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start exploring"
            onPress={onStart}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Start Exploring</Text>
          </Pressable>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in to existing account"
          onPress={onLogin}
          style={({ pressed }) => [styles.loginBtn, pressed && styles.loginBtnPressed]}>
          <Text style={[styles.loginText, { fontFamily: bodyFont }]}>Already have an account? <Text style={styles.loginTextBold}>Log In</Text></Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    overflow: 'hidden',
  },
  dot: {
    position: 'absolute',
    backgroundColor: colors.card,
  },
  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: space[8],
  },
  tagline: {
    fontSize: 16,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    opacity: 0.95,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  cardsImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    height: 320,
  },
  bottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 160,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space[16],
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
    justifyContent: 'center',
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
  loginBtn: {
    marginTop: space[8],
    alignItems: 'center',
    paddingVertical: space[8],
  },
  loginBtnPressed: {
    opacity: 0.7,
  },
  loginText: {
    fontSize: typeTokens.size.body,
    color: colors.card,
    opacity: 0.9,
  },
  loginTextBold: {
    fontWeight: '700',
  },
})
