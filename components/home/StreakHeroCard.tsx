import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

interface StreakHeroCardProps {
  streakDays: number
  /** localDateKey() of every day the user logged a sighting. */
  sightingDates: Set<string>
}

export function StreakHeroCard({ streakDays, sightingDates }: StreakHeroCardProps) {
  const router = useRouter()
  const today = new Date()
  const spottedToday = sightingDates.has(localDateKey(today))

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    return {
      label: DAY_LABELS[d.getDay()],
      filled: sightingDates.has(localDateKey(d)),
      isToday: i === 6,
    }
  })

  const title =
    streakDays > 0 ? `${streakDays}-day streak` : spottedToday ? 'Streak started!' : 'Start your streak'
  const subtitle = spottedToday
    ? "Today's done — see you tomorrow to keep it alive."
    : streakDays > 0
      ? 'Spot 1 creature today to keep it going.'
      : 'Spot your first creature to light the flame.'

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.flameBubble}>
          <Text style={styles.flame}>🔥</Text>
        </View>
        <View style={styles.titleCol}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.weekRow}>
        {week.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <View
              style={[styles.dot, d.filled && styles.dotFilled, d.isToday && !d.filled && styles.dotToday]}>
              {d.filled ? <Ionicons name="flame" size={14} color={colors.card} /> : null}
            </View>
            <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
          </View>
        ))}
      </View>

      {spottedToday ? (
        <View style={styles.safePill}>
          <Ionicons name="checkmark-circle" size={16} color={colors.green} />
          <Text style={styles.safeText}>Streak safe for today</Text>
        </View>
      ) : (
        <View style={styles.ctaShadow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Spot a creature now"
            onPress={() => router.push('/capture/scan')}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Ionicons name="camera" size={18} color={colors.card} />
            <Text style={styles.ctaText}>Spot now</Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space[16],
    gap: space[16],
    marginHorizontal: space[16],
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
  },
  flameBubble: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: `${colors.coral}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flame: {
    fontSize: 26,
  },
  titleCol: {
    flex: 1,
    gap: space[4],
  },
  title: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 18,
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
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotFilled: {
    backgroundColor: colors.coral,
    borderColor: colors.coral,
  },
  dotToday: {
    borderColor: colors.coral,
    borderWidth: 2,
  },
  dayLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  dayLabelToday: {
    color: colors.coral,
  },
  ctaShadow: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.sm,
    paddingBottom: 4,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: space[16],
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
  },
  ctaText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
  },
  safePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: `${colors.green}14`,
    borderRadius: radius.sm,
    paddingVertical: space[16],
  },
  safeText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
})
