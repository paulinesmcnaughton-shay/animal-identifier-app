import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import type { EdgeInsets } from 'react-native-safe-area-context'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/src/design/tokens'

const CARD = 130
const R = 28
const LOGO = 56

interface WelcomeSlideProps {
  insets: EdgeInsets
  onStart: () => void
  displayFont: string
  bodyFont: string
  slideHeight: number
}

export function WelcomeSlide({ insets, onStart, displayFont, bodyFont, slideHeight }: WelcomeSlideProps) {
  const bottomPad = Math.max(insets.bottom, 16) + 36

  return (
    <LinearGradient colors={['#FFC93C', '#FF9500']} style={[styles.flex, { minHeight: slideHeight }]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <View style={[styles.bokeh, { top: insets.top + 60, left: 24 }]} />
      <View style={[styles.bokeh, { top: insets.top + 140, right: 40 }]} />
      <View style={[styles.bokeh, { top: slideHeight * 0.35, left: '18%' }]} />
      <View style={[styles.bokeh, { top: slideHeight * 0.42, right: '22%' }]} />

      <View style={[styles.topBlock, { paddingTop: insets.top + 24 }]}>
        <View style={styles.logo}>
          <Ionicons name="leaf" size={28} color="#fff" />
        </View>
        <Text style={[styles.title, { fontFamily: displayFont }]}>Wildr</Text>
        <Text style={[styles.kicker, { fontFamily: bodyFont }]}>YOUR POCKET FIELD GUIDE</Text>
      </View>

      <View style={styles.cardsStage}>
        <View style={[styles.card, styles.cardOrange, { top: 8, left: 16, transform: [{ rotate: '-8deg' }] }]} />
        <View style={[styles.card, styles.cardYellow, { top: 0, right: 20, transform: [{ rotate: '10deg' }] }]} />
        <View style={[styles.card, styles.cardGreen, { bottom: 12, alignSelf: 'center', transform: [{ rotate: '-4deg' }] }]} />
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Start exploring" onPress={onStart} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: bodyFont }]}>START EXPLORING</Text>
        </Pressable>
      </View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  bokeh: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  topBlock: {
    alignItems: 'center',
    gap: 10,
  },
  logo: {
    width: LOGO,
    height: LOGO,
    borderRadius: LOGO / 2,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 48,
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  kicker: {
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
    opacity: 0.95,
  },
  cardsStage: {
    flex: 1,
    marginTop: 8,
    position: 'relative',
    minHeight: CARD + 40,
  },
  card: {
    position: 'absolute',
    width: CARD,
    height: CARD,
    borderRadius: R,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  cardOrange: {
    backgroundColor: '#FF9500',
  },
  cardYellow: {
    backgroundColor: '#FFC93C',
  },
  cardGreen: {
    backgroundColor: colors.green,
  },
  footer: {
    paddingHorizontal: 20,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
})
