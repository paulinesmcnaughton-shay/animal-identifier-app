import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native'
import type { EdgeInsets } from 'react-native-safe-area-context'

import { OnboardingSpeciesArt } from '@/src/screens/onboarding/onboarding-species-art'
import type { OnboardingSpeciesKind } from '@/src/screens/onboarding/onboarding-species-art'
import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

const STAGE_W = 354
const STAGE_H = 320
const ART = 120
const ART_R = 16

const CARD_DATA: {
  kind: OnboardingSpeciesKind
  label: string
  x: number
  y: number
  r: string
  locked?: boolean
}[] = [
  { kind: 'fox', label: 'Spotted', x: 24, y: 0, r: '-6deg' },
  { kind: 'cardinal', label: 'Spotted', x: 175, y: 18, r: '5deg' },
  { kind: 'monarch', label: 'Locked', x: 60, y: 165, r: '4deg' },
  { kind: 'frog', label: '???', x: 196, y: 165, r: '-8deg', locked: true },
]

interface CollectSlideProps {
  insets: EdgeInsets
  onFinish: () => void
  onSkip: () => void
  displayFont: string
  bodyFont: string
  slideHeight: number
}

function DexMiniCard({
  label,
  children,
  style,
}: {
  label: string
  children: ReactNode
  style: ViewStyle
}) {
  return (
    <View style={[styles.cardWrap, style]}>
      <View style={styles.cardInner}>{children}</View>
      <Text style={styles.cardCaption}>{label}</Text>
    </View>
  )
}

export function CollectSlide({ insets, onFinish, onSkip, displayFont, bodyFont, slideHeight }: CollectSlideProps) {
  const bottomPad = Math.max(insets.bottom, 50)

  return (
    <View style={[styles.screen, { minHeight: slideHeight }]}>
      <View style={[styles.skipWrap, { top: insets.top + 16 }]}>
        <Pressable onPress={onSkip} accessibilityRole="button" accessibilityLabel="Skip onboarding" hitSlop={12}>
          <Text style={[styles.skip, { fontFamily: bodyFont }]}>SKIP</Text>
        </Pressable>
      </View>

      <View style={[styles.topCopy, { paddingTop: insets.top + 110 }]}>
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Like Pokédex</Text>
          </View>
        </View>
        <Text style={[styles.headline, { fontFamily: displayFont }]}>
          Build your own{'\n'}Wild Dex.
        </Text>
        <Text style={[styles.body, { fontFamily: bodyFont }]}>
          Earn badges, hit streaks, and collect every creature you spot in the wild.
        </Text>
      </View>

      <View style={[styles.stage, { top: insets.top + 360 }]}>
        <View style={{ width: STAGE_W, height: STAGE_H, position: 'relative' }}>
          {CARD_DATA.map((c, i) => (
            <DexMiniCard
              key={i}
              label={c.label}
              style={{
                position: 'absolute',
                top: c.y,
                left: c.x,
                transform: [{ rotate: c.r }],
              }}>
              {c.locked ? (
                <View style={styles.lockedTile}>
                  <Text style={styles.qmark}>?</Text>
                </View>
              ) : (
                <OnboardingSpeciesArt kind={c.kind} size={ART} rounded={ART_R} />
              )}
            </DexMiniCard>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomPad }]}>
        <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Lets go" style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: displayFont }]}>Let&apos;s go!</Text>
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
  stage: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    height: STAGE_H,
  },
  cardWrap: {
    backgroundColor: colors.card,
    borderRadius: 22,
    padding: space[8],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(20,30,48,0.06)',
  },
  cardInner: {
    width: ART,
    height: ART,
    borderRadius: ART_R,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCaption: {
    paddingTop: space[8],
    paddingBottom: 2,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  lockedTile: {
    width: ART,
    height: ART,
    borderRadius: ART_R,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qmark: {
    fontSize: 50,
    fontWeight: typeTokens.body.weights.black,
    color: '#CBD5E1',
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
