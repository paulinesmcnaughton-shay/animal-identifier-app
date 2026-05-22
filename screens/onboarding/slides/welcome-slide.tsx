import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { WildKindLogo } from '@/components/WildKindLogo'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const welcomeCardsImage = require('@/assets/images/wildkind-onboarding-image.png')

const HERO_COPY_MAX_WIDTH = 300

interface WelcomeSlideProps {
  insets: EdgeInsets
  onStart: () => void
  onLogin: () => void
  displayFont: string
  bodyFont: string
  subtitleFont: string
  slideHeight: number
}

export function WelcomeSlide({ insets, onStart, onLogin, displayFont, bodyFont, subtitleFont, slideHeight }: WelcomeSlideProps) {
  const bottomPad = Math.max(insets.bottom, 50)

  return (
    <View style={[styles.flex, { minHeight: slideHeight, backgroundColor: colors.canvas }]}>
      <View style={[styles.content, { paddingTop: insets.top + space[80] }]}>
        <View style={styles.hero}>
          <View style={styles.heroCopy}>
            <View style={styles.logoSlot}>
              <WildKindLogo color={colors.green} />
            </View>
            <Text style={[styles.tagline, { fontFamily: bodyFont }]}>Your Pocket Field Guide</Text>
            <Text style={[styles.subtitle, { fontFamily: subtitleFont }]}>
              From your backyard to the zoo,{'\n'}discover it all.
            </Text>
          </View>
        </View>

        <Image
          source={welcomeCardsImage}
          style={styles.cardsImage}
          resizeMode="contain"
          accessibilityLabel="Wildlife field guide cards"
        />
      </View>

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
  content: {
    alignItems: 'center',
  },
  hero: {
    alignItems: 'center',
  },
  heroCopy: {
    width: '100%',
    maxWidth: HERO_COPY_MAX_WIDTH,
    paddingHorizontal: space[32],
    alignItems: 'center',
    gap: space[8],
  },
  logoSlot: {
    width: '100%',
    aspectRatio: 1122 / 297,
  },
  tagline: {
    fontSize: 16,
    color: colors.green,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typeTokens.size.bodySM,
    lineHeight: 20,
    color: colors.mapUser,
    textAlign: 'center',
    width: '100%',
  },
  cardsImage: {
    width: '100%',
    height: 320,
    marginTop: space[24],
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: space[16],
  },
  ctaWrap: {
    backgroundColor: colors.greenDeep,
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
    color: colors.green,
  },
  loginTextBold: {
    fontWeight: '700',
  },
})
