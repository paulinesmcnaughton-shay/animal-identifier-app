import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/src/design/tokens'

const RING = 260
const INNER = 248
const CARD = 160

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
  const bottomPad = Math.max(insets.bottom, 16) + 36

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <View style={styles.ringSection}>
        <View style={styles.ringOuter}>
          <LinearGradient
            colors={['#FF6B5B', '#FFC93C', '#15B981', '#5BC0EB', '#A855F7', '#FF6B5B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.ringInner} />
        </View>

        <View style={styles.sparkleGold}>
          <Ionicons name="sparkles" size={22} color="#E6B422" />
        </View>
        <View style={styles.sparkleGreen}>
          <Ionicons name="sparkles" size={22} color={colors.green} />
        </View>

        <View style={styles.scanCard}>
          <View style={[styles.bracket, styles.bracketTL]} />
          <View style={[styles.bracket, styles.bracketTR]} />
          <View style={[styles.bracket, styles.bracketBL]} />
          <View style={[styles.bracket, styles.bracketBR]} />
          <View style={styles.scanLine} />
          <View style={styles.bird}>
            <View style={styles.birdBody} />
            <View style={styles.birdBeak} />
          </View>
        </View>
      </View>

      <View style={styles.copy}>
        <Text style={[styles.headline, { fontFamily: displayFont }]}>
          Snap any critter.{'\n'}Know it instantly.
        </Text>
        <Text style={[styles.body, { fontFamily: bodyFont }]}>
          Point your camera at{' '}
          <Text style={{ fontFamily: bodyBoldFont, color: colors.green }}>any animal or insect</Text>
          {' '}and Wildr identifies the species in seconds.
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Continue" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: bodyFont }]}>CONTINUE</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF8E7',
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
  },
  skip: {
    fontSize: 14,
    color: colors.dim,
    letterSpacing: 0.8,
  },
  ringSection: {
    height: RING + 32,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: 4,
  },
  ringOuter: {
    width: RING,
    height: RING,
    borderRadius: RING / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: '#FFF8E7',
    position: 'absolute',
  },
  sparkleGold: {
    position: 'absolute',
    top: '20%',
    alignSelf: 'center',
    marginLeft: RING * 0.38,
  },
  sparkleGreen: {
    position: 'absolute',
    top: '52%',
    alignSelf: 'center',
    marginLeft: -RING * 0.42,
  },
  scanCard: {
    position: 'absolute',
    top: (RING - CARD) / 2,
    width: CARD,
    height: CARD,
    borderRadius: 22,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  bracket: {
    position: 'absolute',
    width: 20,
    height: 20,
  },
  bracketTL: {
    top: 10,
    left: 10,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
  },
  bracketTR: {
    top: 10,
    right: 10,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
  },
  bracketBL: {
    bottom: 10,
    left: 10,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#FFFFFF',
  },
  bracketBR: {
    bottom: 10,
    right: 10,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#FFFFFF',
  },
  scanLine: {
    position: 'absolute',
    left: '8%',
    right: '8%',
    height: 3,
    top: '48%',
    backgroundColor: '#FF9500',
    borderRadius: 2,
    shadowColor: '#FF9500',
    shadowOpacity: 0.85,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  bird: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  birdBody: {
    width: 56,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#152130',
  },
  birdBeak: {
    marginTop: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFC93C',
  },
  copy: {
    marginTop: 16,
    gap: 14,
    alignItems: 'center',
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink2,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 0,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
})
