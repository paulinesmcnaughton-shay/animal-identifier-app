import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { OnboardingSpeciesArt } from '@/src/screens/onboarding/onboarding-species-art'
import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

/** Design file warm stops (between token sun / coral). */
const WELCOME_TOP = '#FFE89C'
const WELCOME_MID = colors.sun
const WELCOME_END = '#FF9D5C'

const LOGO = 88
const CLUSTER_W = 320
const CLUSTER_H = 280

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

      <View style={[styles.bokeh, { top: insets.top + 90, left: 30, width: 8, height: 8, borderRadius: 4, opacity: 0.5 }]} />
      <View style={[styles.bokeh, { top: insets.top + 130, right: 50, width: 12, height: 12, borderRadius: 6, opacity: 0.4 }]} />
      <View style={[styles.bokeh, { top: insets.top + 200, left: 70, width: 6, height: 6, borderRadius: 3, opacity: 0.6 }]} />
      <View style={[styles.bokeh, { bottom: 280, right: 80, width: 14, height: 14, borderRadius: 7, opacity: 0.35 }]} />

      <View style={[styles.hero, { top: insets.top + 110 }]}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={40} color={colors.card} />
        </View>
        <Text style={[styles.title, { fontFamily: displayFont }]}>Wildr</Text>
        <Text style={[styles.tagline, { fontFamily: bodyFont }]}>Your Pocket Field Guide</Text>
      </View>

      <View style={[styles.clusterWrap, { top: insets.top + 320 }]}>
        <View style={{ width: CLUSTER_W, height: CLUSTER_H }}>
          <View style={[styles.clusterCard, { top: 0, left: 40, transform: [{ rotate: '-8deg' }] }]}>
            <OnboardingSpeciesArt kind="fox" size={150} rounded={36} />
          </View>
          <View style={[styles.clusterCard, { top: 30, right: 20, transform: [{ rotate: '10deg' }] }]}>
            <OnboardingSpeciesArt kind="monarch" size={130} rounded={32} />
          </View>
          <View style={[styles.clusterCard, { bottom: 0, left: 80, transform: [{ rotate: '4deg' }] }]}>
            <OnboardingSpeciesArt kind="frog" size={140} rounded={34} />
          </View>
        </View>
      </View>

      <LinearGradient
        colors={['rgba(255,157,92,0)', 'rgba(255,157,92,0.85)']}
        locations={[0, 1]}
        style={styles.bottomFade}
        pointerEvents="none"
      />

      <View style={[styles.footer, { paddingBottom: bottomPad, paddingTop: space[24], paddingHorizontal: space[24] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start exploring"
          onPress={onStart}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Start Exploring</Text>
        </Pressable>
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
  bokeh: {
    position: 'absolute',
    backgroundColor: colors.card,
  },
  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 18,
  },
  logo: {
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  title: {
    fontSize: 54,
    color: colors.card,
    lineHeight: 54,
    letterSpacing: -0.8,
    textShadowColor: 'rgba(146,99,58,0.25)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 0,
  },
  tagline: {
    fontSize: 16,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    opacity: 0.95,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  clusterWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: CLUSTER_H,
    alignItems: 'center',
  },
  clusterCard: {
    position: 'absolute',
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
    bottom: 0,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontWeight: typeTokens.display.weight,
  },
  loginBtn: {
    marginTop: space[16],
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
