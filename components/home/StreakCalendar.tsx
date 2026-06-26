import { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'

import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const DAY_MS = 86_400_000

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function startOfWeekMonday(today: Date): Date {
  const d = new Date(today)
  const offset = (d.getDay() + 6) % 7 // 0 = Monday
  d.setDate(d.getDate() - offset)
  d.setHours(0, 0, 0, 0)
  return d
}

function longestRun(dayKeys: Set<string>): number {
  const times = [...dayKeys]
    .map((k) => {
      const [y, m, d] = k.split('-').map(Number)
      return new Date(y, m, d).getTime()
    })
    .sort((a, b) => a - b)
  let best = 0
  let run = 0
  let prev = NaN
  for (const t of times) {
    run = t - prev === DAY_MS ? run + 1 : 1
    prev = t
    if (run > best) best = run
  }
  return best
}

interface StreakCalendarProps {
  streakDays: number
  sightingDates: Set<string>
}

export function StreakCalendar({ streakDays, sightingDates }: StreakCalendarProps) {
  const today = new Date()
  const todayKey = localDateKey(today)
  const spottedToday = sightingDates.has(todayKey)
  const monday = startOfWeekMonday(today)
  const bestStreak = Math.max(streakDays, longestRun(sightingDates))

  const week = DAY_LABELS.map((label, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const key = localDateKey(d)
    const isToday = key === todayKey
    const state: 'done' | 'today' | 'empty' = sightingDates.has(key)
      ? 'done'
      : isToday
        ? 'today'
        : 'empty'
    return { label, state }
  })

  const pulse = useSharedValue(1)
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.07, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [pulse])
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.leftRow}>
          <Animated.Text style={[styles.flame, flameStyle]}>🔥</Animated.Text>
          <View>
            <Text style={styles.title}>
              {streakDays > 0 ? `${streakDays}-day streak` : 'Start your streak'}
            </Text>
            <Text style={styles.subtitle}>
              {spottedToday ? 'Nice — see you tomorrow!' : 'Spot today to keep it going'}
            </Text>
          </View>
        </View>
        <View style={styles.bestChip}>
          <Text style={styles.bestText}>BEST {bestStreak}</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {week.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <View
              style={[
                styles.dot,
                d.state === 'done' && styles.dotDone,
                d.state === 'today' && styles.dotToday,
              ]}>
              <Text style={d.state === 'today' ? styles.star : styles.dotEmoji}>
                {d.state === 'done' ? '🔥' : d.state === 'today' ? '★' : ''}
              </Text>
            </View>
            <Text
              style={[
                styles.dayLabel,
                d.state === 'empty' && styles.dayLabelEmpty,
                d.state === 'today' && styles.dayLabelToday,
              ]}>
              {d.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: space[16],
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: space[16],
    gap: space[16],
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  flame: {
    fontSize: 22,
  },
  title: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.inkGreen,
  },
  subtitle: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.muted,
  },
  bestChip: {
    backgroundColor: colors.flameSoft,
    borderRadius: 9,
    paddingHorizontal: space[8],
    paddingVertical: space[8],
  },
  bestText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.6,
    color: colors.flame,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayCol: {
    alignItems: 'center',
    gap: space[4],
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    backgroundColor: colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.flame,
  },
  dotToday: {
    backgroundColor: colors.card,
    borderWidth: 2.5,
    borderStyle: 'dashed',
    borderColor: colors.gold,
  },
  dotEmoji: {
    fontSize: 15,
  },
  star: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.inkGreen,
  },
  dayLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.muted,
  },
  dayLabelEmpty: {
    color: colors.earthLight,
  },
  dayLabelToday: {
    color: colors.inkGreen,
  },
})
