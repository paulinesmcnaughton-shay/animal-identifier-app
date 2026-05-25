import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View } from 'react-native'

import { ProgressBar } from '@/components/ProgressBar'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

interface CollectionStatsCardProps {
  collected: number
  total: number
  streakDays: number
  trophies: number
  showStreak?: boolean
}

export function CollectionStatsCard({
  collected,
  total,
  streakDays,
  trophies,
  showStreak = streakDays > 0,
}: CollectionStatsCardProps) {
  const progress = total > 0 ? collected / total : 0

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.counts}>
          <Text style={styles.countBig}>
            <Text style={styles.countGreen}>{collected}</Text>
            <Text style={styles.countGrey}> / {total}</Text>
          </Text>
        </View>
        <View style={styles.badges}>
          {showStreak ? (
            <View style={[styles.badge, styles.badgeStreak]}>
              <Ionicons name="flame" size={14} color={colors.coralDeep} />
              <Text style={styles.badgeTextStreak}>{streakDays}d</Text>
            </View>
          ) : null}
          <View style={[styles.badge, styles.badgeTrophy]}>
            <Ionicons name="trophy" size={14} color="#B8860B" />
            <Text style={styles.badgeTextTrophy}>{trophies}</Text>
          </View>
        </View>
      </View>
      <ProgressBar progress={progress} />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: space[16],
    gap: space[16],
    ...shadow.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  counts: {
    flex: 1,
  },
  countBig: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  countGreen: {
    color: colors.green,
  },
  countGrey: {
    color: colors.dim,
    fontWeight: '700',
  },
  badges: {
    flexDirection: 'row',
    gap: space[8],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  badgeStreak: {
    backgroundColor: '#FFE8E4',
  },
  badgeTrophy: {
    backgroundColor: '#FFF4D6',
  },
  badgeTextStreak: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: colors.coralDeep,
  },
  badgeTextTrophy: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: colors.ink2,
  },
})
