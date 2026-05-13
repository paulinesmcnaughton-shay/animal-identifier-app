import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { OnboardingSpeciesArt } from '@/src/screens/onboarding/onboarding-species-art'
import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

const BOX = 280
const RING = BOX
const INSET = 20
const INNER = RING - INSET * 2
const VIEW = 160
const OFFSET = (RING - VIEW) / 2

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

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.skipWrap, { top: insets.top + 16 }]}>
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <View style={[styles.main, { paddingTop: insets.top + 130 }]}>
        <View style={styles.illustration}>
          <View style={styles.ringTint}>
            <LinearGradient
              colors={[colors.lime, colors.green, colors.sky, colors.plum, colors.coral, colors.lime]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          <View style={[styles.ringCutout, { width: INNER, height: INNER, borderRadius: INNER / 2 }]} />

          <View style={[styles.sparkleTR, { top: 30, right: 20 }]}>
            <Ionicons name="sparkles" size={26} color={colors.sun} />
          </View>
          <View style={[styles.sparkleBL, { bottom: 40, left: 20 }]}>
            <Ionicons name="sparkles" size={20} color={colors.green} />
          </View>

          <View style={[styles.viewfinder, { top: OFFSET, left: OFFSET }]}>
            <View style={styles.viewfinderInner}>
              <OnboardingSpeciesArt kind="cardinal" size={VIEW} rounded={0} />
            </View>
            <View style={[styles.bracket, styles.bracketTL]} />
            <View style={[styles.bracket, styles.bracketTR]} />
            <View style={[styles.bracket, styles.bracketBL]} />
            <View style={[styles.bracket, styles.bracketBR]} />
            <LinearGradient
              colors={['transparent', colors.lime, 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.scanLine}
            />
          </View>
        </View>

        <View style={styles.copy}>
          <Text style={[styles.headline, { fontFamily: displayFont }]}>
            Snap any critter.{'\n'}Know it instantly.
          </Text>
          <Text style={[styles.body, { fontFamily: bodyFont }]}>
            Point your camera at <Text style={{ fontFamily: bodyBoldFont, color: colors.green }}>any animal or insect</Text> and Wildr identifies the species in seconds.
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Continue" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Continue</Text>
        </Pressable>
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
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  main: {
    alignItems: 'center',
    gap: space[24],
  },
  illustration: {
    width: BOX,
    height: BOX,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringTint: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: RING / 2,
    overflow: 'hidden',
    opacity: 0.15,
  },
  ringCutout: {
    position: 'absolute',
    top: INSET,
    left: INSET,
    backgroundColor: colors.bg2,
  },
  sparkleTR: {
    position: 'absolute',
    zIndex: 2,
  },
  sparkleBL: {
    position: 'absolute',
    zIndex: 2,
  },
  viewfinder: {
    position: 'absolute',
    width: VIEW,
    height: VIEW,
    borderRadius: radius.xxl,
    overflow: 'hidden',
    backgroundColor: '#000000',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 3,
  },
  viewfinderInner: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  bracket: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    zIndex: 4,
  },
  bracketTL: {
    top: 12,
    left: 12,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.card,
  },
  bracketTR: {
    top: 12,
    right: 12,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.card,
  },
  bracketBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.card,
  },
  bracketBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.card,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    marginTop: -1,
    height: 2,
    zIndex: 5,
  },
  copy: {
    paddingHorizontal: space[12],
    alignItems: 'center',
    gap: space[12],
  },
  headline: {
    fontSize: 36,
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
    bottom: 0,
    paddingTop: space[24],
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    shadowColor: colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  ctaPressed: {
    opacity: 0.92,
  },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    fontWeight: typeTokens.display.weight,
  },
})
