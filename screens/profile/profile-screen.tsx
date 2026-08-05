import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfileDisplayName } from '@/components/profile/ProfileDisplayName'
import { RecentSpotsSection } from '@/components/profile/RecentSpotsSection'
import { SpottingActivitySection } from '@/components/profile/SpottingActivitySection'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { formatProfileStreakLabel } from '@/features/profile/streak'
import { levelForTotalXp } from '@/features/profile/xp-progress'
import { useAccountProfile } from '@/features/settings/account-profile'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'

const H_PAD = screenLayout.padH
const GRID_GAP = space[8]

const XP_TO_STATS_GAP = space[24]
const STATS_CARD_HERO_OVERLAP = space[40]

export function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const {
    displayName,
    username,
    xp,
    spotsCaptured,
    rareSpotted,
    streakDays,
    badgesCount,
    isLoading,
    isReady,
  } = useAccountProfile()
  const { recentCards, rows: sightingRows } = useUserSightingsData()
  const sightingDates = useMemo(() => sightingRows.map((row) => row.spotted_at), [sightingRows])

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GRID_GAP * 2) / 3
  }, [])

  const xpProgress = useMemo(() => levelForTotalXp(xp), [xp])
  const level = xpProgress.level

  const stats = useMemo(
    () => [
      { value: String(spotsCaptured), label: 'Spotted', color: colors.green },
      { value: String(rareSpotted), label: 'Rare', color: colors.sun },
      { value: String(streakDays), label: 'Streak', color: colors.coral },
      { value: String(badgesCount), label: 'Badges', color: colors.plum },
    ],
    [spotsCaptured, rareSpotted, streakDays, badgesCount],
  )

  const handleSeeAllSpots = useCallback(() => {
    router.push('/(tabs)/dex')
  }, [router])

  if (isLoading || !isReady) {
    return (
      <View style={[styles.root, styles.loading]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 + space[24] }}
        showsVerticalScrollIndicator={false}>

        <View style={[styles.hero, { paddingTop: contentTopInset(insets.top) }]}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar size={72} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <ProfileDisplayName displayName={displayName} style={styles.userName} />
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>LVL {level}</Text>
                </View>
              </View>
              <Text style={styles.handle}>@{username}</Text>
              {streakDays > 0 ? (
                <View style={styles.streakRow}>
                  <Text style={styles.streakFlame}>🔥</Text>
                  <Text style={styles.streakText}>{formatProfileStreakLabel(streakDays)}</Text>
                </View>
              ) : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="settings-outline" size={22} color={colors.card} />
            </Pressable>
          </View>

          <View style={styles.xpCard}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpCurrent}>
                {xpProgress.xpIntoLevel.toLocaleString()} / {xpProgress.xpForLevel.toLocaleString()} XP
              </Text>
              <Text style={styles.xpNext}>
                {xpProgress.xpRemaining.toLocaleString()} to Lvl {level + 1}
              </Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpProgress.progress * 100}%` }]} />
            </View>
          </View>
        </View>

        <View style={styles.statsCard}>
          {stats.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < stats.length - 1 && styles.statBorder]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.recentSection}>
          <RecentSpotsSection
            spotsCaptured={spotsCaptured}
            recentCards={recentCards}
            cardWidth={colWidth}
            onSeeAll={handleSeeAllSpots}
          />
        </View>

        <SpottingActivitySection spotsCaptured={spotsCaptured} sightingDates={sightingDates} />

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    backgroundColor: colors.green,
    paddingHorizontal: screenLayout.padH,
    paddingBottom: XP_TO_STATS_GAP + STATS_CARD_HERO_OVERLAP,
  },
  navBtn: {
    flexShrink: 0,
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
    borderRadius: screenLayout.iconBtnSize / 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[16],
    marginBottom: space[16],
  },
  avatarWrap: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    gap: space[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    minWidth: 0,
  },
  userName: {
    flex: 1,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  levelBadge: {
    flexShrink: 0,
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
    paddingHorizontal: space[8],
    paddingVertical: 2,
  },
  levelText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.black,
    color: colors.ink,
  },
  handle: {
    fontSize: typeTokens.size.bodySM,
    color: 'rgba(255,255,255,0.8)',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  streakFlame: {
    fontSize: 14,
  },
  streakText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  xpCard: {
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: radius.md,
    padding: space[16],
    gap: space[8],
  },
  xpLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpCurrent: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  xpNext: {
    fontSize: typeTokens.size.bodySM,
    color: 'rgba(255,255,255,0.75)',
  },
  xpTrack: {
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    marginHorizontal: space[16],
    marginTop: -STATS_CARD_HERO_OVERLAP,
    paddingVertical: space[16],
    ...shadow.card,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: space[4],
  },
  statBorder: {
    borderRightWidth: 1,
    borderRightColor: colors.hairline,
  },
  statValue: {
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.body.weights.black,
  },
  statLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentSection: {
    marginTop: space[24],
  },
})
