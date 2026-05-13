import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { colors } from '@/src/design/tokens'

const CARD = 120
const R = 18

interface CollectSlideProps {
  insets: EdgeInsets
  onFinish: () => void
  onSkip: () => void
  displayFont: string
  bodyFont: string
  slideHeight: number
}

function MiniCard({
  bg,
  label,
  labelColor,
  style,
  children,
}: {
  bg: string
  label: string
  labelColor: string
  style?: object
  children?: React.ReactNode
}) {
  return (
    <View style={[styles.mini, { backgroundColor: bg, transform: style ? (style as { transform?: unknown }).transform : undefined }, style]}>
      <View style={styles.miniInner}>{children}</View>
      <Text style={[styles.miniLabel, { color: labelColor }]}>{label}</Text>
    </View>
  )
}

export function CollectSlide({ insets, onFinish, onSkip, displayFont, bodyFont, slideHeight }: CollectSlideProps) {
  const bottomPad = Math.max(insets.bottom, 16) + 36

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <View style={[styles.pill, { alignSelf: 'flex-start' }]}>
        <Text style={styles.pillText}>LIKE POKÉDEX</Text>
      </View>

      <Text style={[styles.headline, { fontFamily: displayFont }]}>Build your own{'\n'}Wild Dex.</Text>
      <Text style={[styles.body, { fontFamily: bodyFont }]}>
        Earn badges, hit streaks, and collect every creature you spot in the wild.
      </Text>

      <View style={styles.fanStage}>
        <MiniCard
          bg="#FF9500"
          label="SPOTTED"
          labelColor={colors.dim}
          style={{ position: 'absolute', left: 8, top: 28, transform: [{ rotate: '-12deg' }] }}
        >
          <View style={styles.catBlob} />
        </MiniCard>
        <MiniCard
          bg="#E04A39"
          label="SPOTTED"
          labelColor={colors.dim}
          style={{ position: 'absolute', right: 4, top: 8, transform: [{ rotate: '14deg' }] }}
        >
          <View style={styles.birdBlob} />
        </MiniCard>
        <MiniCard
          bg="#FFC93C"
          label="LOCKED"
          labelColor={colors.dim}
          style={{ position: 'absolute', left: 28, bottom: 0, transform: [{ rotate: '-6deg' }] }}
        >
          <View style={styles.butterfly} />
        </MiniCard>
        <MiniCard
          bg="#E7EDF3"
          label="???"
          labelColor={colors.dim}
          style={{ position: 'absolute', right: 20, bottom: 16, transform: [{ rotate: '10deg' }] }}
        >
          <Text style={styles.qmark}>?</Text>
        </MiniCard>
      </View>

      <View style={{ flex: 1 }} />

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Lets go" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: bodyFont }]}>LET&apos;S GO!</Text>
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
    marginBottom: 12,
  },
  skip: {
    fontSize: 14,
    color: colors.dim,
    letterSpacing: 0.8,
  },
  pill: {
    backgroundColor: colors.coral,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    marginBottom: 16,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  headline: {
    fontSize: 30,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.dim,
    marginBottom: 20,
  },
  fanStage: {
    height: 260,
    position: 'relative',
    marginTop: 8,
  },
  mini: {
    width: CARD,
    borderRadius: R,
    paddingBottom: 8,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  miniInner: {
    height: 78,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  catBlob: {
    width: 48,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#152130',
  },
  birdBlob: {
    width: 44,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#152130',
  },
  butterfly: {
    width: 52,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#152130',
    opacity: 0.9,
  },
  qmark: {
    fontSize: 44,
    fontWeight: '200',
    color: '#9AA5B5',
  },
  footer: {},
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
    fontWeight: '800',
  },
})
