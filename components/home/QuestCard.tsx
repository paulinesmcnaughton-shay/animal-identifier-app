import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { type DimensionValue, StyleSheet, Text, View } from 'react-native'

import { radius, space, type as typeTokens } from '@/design/tokens'
import type { QuestKey, QuestProgress } from '@/features/quests/quests'

interface QuestCardProps {
  progress: QuestProgress
  width: number
}

export function QuestCard({ progress, width }: QuestCardProps) {
  const { quest, count } = progress
  const theme = QUEST_THEME[quest.id]
  const pct = Math.max(0, Math.min(1, count / quest.target))

  const body = (
    <>
      <QuestPattern kind={theme.pattern} />
      <View style={styles.content}>
        <Text style={[styles.eyebrow, { color: theme.eyebrowColor }]} numberOfLines={1}>
          {quest.eyebrow}
        </Text>
        <Text style={[styles.title, { color: theme.titleColor }]} numberOfLines={2}>
          {quest.title}
        </Text>

        <View style={[styles.track, { backgroundColor: theme.trackColor }]}>
          <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: theme.fillColor }]} />
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.pips}>
            {Array.from({ length: quest.pips }).map((_, i) => {
              const threshold = Math.ceil(((i + 1) * quest.target) / quest.pips)
              const filled = count >= threshold
              return (
                <View
                  key={i}
                  style={[
                    styles.pip,
                    filled
                      ? { backgroundColor: theme.pipFillBg }
                      : { borderWidth: 2, borderStyle: 'dashed', borderColor: theme.pipBorder },
                  ]}>
                  {filled ? (
                    <Ionicons name="checkmark" size={15} color={theme.pipFillFg} />
                  ) : (
                    <Ionicons name="add" size={13} color={theme.pipEmptyColor} />
                  )}
                </View>
              )
            })}
          </View>

          <QuestPill theme={theme} label={`+${quest.xpReward} XP`} />
        </View>
      </View>
    </>
  )

  const wrapStyle = [
    styles.card,
    { width },
    theme.shadowColor ? { shadowColor: theme.shadowColor, ...shadowProps } : null,
    theme.borderColor ? { borderWidth: 1.5, borderColor: theme.borderColor } : null,
  ]

  if (Array.isArray(theme.bg))
    return (
      <LinearGradient colors={theme.bg} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={wrapStyle}>
        {body}
      </LinearGradient>
    )

  return <View style={[wrapStyle, { backgroundColor: theme.bg }]}>{body}</View>
}

function QuestPill({ theme, label }: { theme: QuestTheme; label: string }) {
  const pill = theme.pill
  const inner = <Text style={[styles.pillText, { color: pill.fg }]}>{label}</Text>
  if (Array.isArray(pill.bg))
    return (
      <View style={[styles.pillShadow, { backgroundColor: pill.bevel }]}>
        <LinearGradient colors={pill.bg} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={styles.pill}>
          {inner}
        </LinearGradient>
      </View>
    )
  return (
    <View style={[styles.pillShadow, { backgroundColor: pill.bevel }]}>
      <View style={[styles.pill, { backgroundColor: pill.bg }]}>{inner}</View>
    </View>
  )
}

function QuestPattern({ kind }: { kind: QuestTheme['pattern'] }) {
  if (!kind) return null
  if (kind === 'sun')
    return <View pointerEvents="none" style={styles.sun} />
  if (kind === 'glow')
    return <View pointerEvents="none" style={styles.glow} />
  if (kind === 'topo')
    return (
      <View pointerEvents="none" style={styles.patternFill}>
        {[64, 46, 28].map((s) => (
          <View key={s} style={[styles.topoRing, { width: s, height: s, borderRadius: s / 2 }]} />
        ))}
      </View>
    )

  const dots = PATTERN_DOTS[kind]
  return (
    <View pointerEvents="none" style={styles.patternFill}>
      {dots.map((d, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            borderRadius: d.size / 2,
            backgroundColor: d.color,
          }}
        />
      ))}
    </View>
  )
}

const shadowProps = {
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 16,
  elevation: 8,
} as const

// Scatter coordinates for the lightweight RN approximations of the design's CSS patterns.
const PATTERN_DOTS: Record<'bubbles' | 'stars' | 'confetti' | 'forestDots', Dot[]> = {
  bubbles: [
    { top: '70%', left: '12%', size: 12, color: 'rgba(255,255,255,0.14)' },
    { top: '54%', left: '34%', size: 7, color: 'rgba(255,255,255,0.1)' },
    { top: '16%', left: '84%', size: 9, color: 'rgba(255,255,255,0.1)' },
  ],
  stars: [
    { top: '20%', left: '18%', size: 3, color: '#fff' },
    { top: '12%', left: '66%', size: 2.5, color: '#fff' },
    { top: '48%', left: '86%', size: 3, color: '#fff' },
    { top: '60%', left: '40%', size: 2.5, color: '#fff' },
  ],
  confetti: [
    { top: '22%', left: '20%', size: 5, color: '#FAD24E' },
    { top: '16%', left: '78%', size: 5, color: '#E9604A' },
    { top: '44%', left: '60%', size: 5, color: '#7aa358' },
    { top: '60%', left: '88%', size: 4, color: '#FAD24E' },
  ],
  forestDots: [
    { top: '18%', left: '82%', size: 3, color: 'rgba(122,163,88,0.4)' },
    { top: '52%', left: '14%', size: 3, color: 'rgba(122,163,88,0.3)' },
    { top: '70%', left: '60%', size: 3, color: 'rgba(122,163,88,0.3)' },
  ],
}

const GOLD_PILL = { bg: ['#FAD24E', '#F0B814'] as [string, string], fg: '#3A2A00', bevel: '#B98708' }

export const QUEST_THEME: Record<QuestKey, QuestTheme> = {
  insect: {
    bg: ['#1E6B41', '#0E3A23'], pattern: 'topo', shadowColor: '#0E3A23',
    eyebrowColor: 'rgba(255,255,255,0.7)', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.18)', fillColor: '#FAD24E',
    pipBorder: 'rgba(255,255,255,0.45)', pipEmptyColor: 'rgba(255,255,255,0.6)', pipFillBg: '#FAD24E', pipFillFg: '#16321F',
    pill: GOLD_PILL,
  },
  bird: {
    bg: ['#FAD24E', '#EFB60F'], pattern: null, shadowColor: '#BE8708',
    eyebrowColor: '#6b4f12', titleColor: '#2a2008',
    trackColor: 'rgba(90,60,20,0.22)', fillColor: '#16321F',
    pipBorder: 'rgba(90,60,20,0.5)', pipEmptyColor: 'rgba(90,60,20,0.6)', pipFillBg: '#16321F', pipFillFg: '#FAD24E',
    pill: { bg: '#16321F', fg: '#FAD24E', bevel: '#0a1f12' },
  },
  reptile: {
    bg: ['#1AA0A0', '#0C5152'], pattern: 'bubbles', shadowColor: '#0C5152',
    eyebrowColor: 'rgba(255,255,255,0.75)', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.2)', fillColor: '#FAD24E',
    pipBorder: 'rgba(255,255,255,0.45)', pipEmptyColor: 'rgba(255,255,255,0.6)', pipFillBg: '#FAD24E', pipFillFg: '#0C5152',
    pill: GOLD_PILL,
  },
  venue: {
    bg: ['#F4995A', '#E9604A'], pattern: 'sun', shadowColor: '#E9604A',
    eyebrowColor: 'rgba(255,255,255,0.8)', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.28)', fillColor: '#fff',
    pipBorder: 'rgba(255,255,255,0.6)', pipEmptyColor: 'rgba(255,255,255,0.75)', pipFillBg: '#fff', pipFillFg: '#E9604A',
    pill: { bg: '#16321F', fg: '#FAD24E', bevel: '#0a1f12' },
  },
  mammal: {
    bg: '#16321F', pattern: 'forestDots', shadowColor: '#0E3A23',
    eyebrowColor: '#FAD24E', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.15)', fillColor: '#FAD24E',
    pipBorder: 'rgba(250,210,78,0.5)', pipEmptyColor: 'rgba(250,210,78,0.7)', pipFillBg: '#FAD24E', pipFillFg: '#16321F',
    pill: GOLD_PILL,
  },
  dusk: {
    bg: ['#3B3D8F', '#191A3D'], pattern: 'stars', shadowColor: '#191A3D',
    eyebrowColor: 'rgba(255,255,255,0.7)', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.18)', fillColor: '#FAD24E',
    pipBorder: 'rgba(255,255,255,0.4)', pipEmptyColor: 'rgba(255,255,255,0.6)', pipFillBg: '#FAD24E', pipFillFg: '#191A3D',
    pill: GOLD_PILL,
  },
  flower: {
    bg: '#DCE7CE', pattern: null, shadowColor: 'rgba(60,90,46,0.5)',
    eyebrowColor: '#3c5a2e', titleColor: '#16321F',
    trackColor: 'rgba(30,92,58,0.18)', fillColor: '#1E5C3A',
    pipBorder: 'rgba(30,92,58,0.4)', pipEmptyColor: 'rgba(30,92,58,0.55)', pipFillBg: '#1E5C3A', pipFillFg: '#fff',
    pill: { bg: '#1E5C3A', fg: '#fff', bevel: '#123a25' },
  },
  water: {
    bg: ['#4FB3CC', '#1E6F84'], pattern: 'bubbles', shadowColor: '#1E6F84',
    eyebrowColor: 'rgba(255,255,255,0.78)', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.2)', fillColor: '#FAD24E',
    pipBorder: 'rgba(255,255,255,0.45)', pipEmptyColor: 'rgba(255,255,255,0.6)', pipFillBg: '#FAD24E', pipFillFg: '#1E6F84',
    pill: GOLD_PILL,
  },
  streak: {
    bg: '#16321F', pattern: 'confetti', shadowColor: '#0E3A23',
    eyebrowColor: '#FAD24E', titleColor: '#fff',
    trackColor: 'rgba(255,255,255,0.15)', fillColor: '#E9604A',
    pipBorder: 'rgba(255,255,255,0.4)', pipEmptyColor: 'rgba(255,255,255,0.6)', pipFillBg: '#E9604A', pipFillFg: '#fff',
    pill: GOLD_PILL,
  },
  rare: {
    bg: ['#23231a', '#0b0b07'], pattern: 'glow', shadowColor: '#000', borderColor: 'rgba(250,210,78,0.45)',
    eyebrowColor: '#FAD24E', titleColor: '#FAD24E',
    trackColor: 'rgba(250,210,78,0.18)', fillColor: '#FAD24E',
    pipBorder: 'rgba(250,210,78,0.5)', pipEmptyColor: 'rgba(250,210,78,0.75)', pipFillBg: '#FAD24E', pipFillFg: '#23231a',
    pill: GOLD_PILL,
  },
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    padding: 17,
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
  },
  eyebrow: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.4,
  },
  title: {
    marginTop: space[8],
    fontSize: 24,
    lineHeight: 26,
    minHeight: 52, // reserve 2 lines so every carousel card is the same height
    fontWeight: typeTokens.body.weights.extra,
  },
  track: {
    height: 10,
    borderRadius: 6,
    marginTop: 13,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 6,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  pips: {
    flexDirection: 'row',
    gap: 7,
  },
  pip: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillShadow: {
    borderRadius: 12,
    paddingBottom: 4,
  },
  pill: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pillText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
  },
  patternFill: {
    ...StyleSheet.absoluteFillObject,
  },
  topoRing: {
    position: 'absolute',
    top: -18,
    right: -18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  sun: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  glow: {
    position: 'absolute',
    right: -20,
    top: -20,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(250,210,78,0.18)',
  },
})

interface Dot {
  top: DimensionValue
  left: DimensionValue
  size: number
  color: string
}

interface PillTheme {
  bg: string | [string, string]
  fg: string
  bevel: string
}

interface QuestTheme {
  bg: string | [string, string]
  pattern: 'topo' | 'bubbles' | 'sun' | 'forestDots' | 'stars' | 'confetti' | 'glow' | null
  shadowColor?: string
  borderColor?: string
  eyebrowColor: string
  titleColor: string
  trackColor: string
  fillColor: string
  pipBorder: string
  pipEmptyColor: string
  pipFillBg: string
  pipFillFg: string
  pill: PillTheme
}
