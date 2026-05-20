import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useMemo } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DexCard } from '@/components/DexCard'
import { getRecentFindDexCards } from '@/data/mock'
import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { dexCardHairline } from '@/design/dex-card-shell'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useAccountProfile } from '@/features/settings/account-profile'

const XP_CURRENT = 2340
const XP_NEXT = 3000
const LEVEL = 14

const STATS = [
  { value: '47', label: 'Spotted', color: colors.green },
  { value: '8',  label: 'Rare',    color: colors.sun },
  { value: '12', label: 'Streak',  color: colors.coral },
  { value: '23', label: 'Badges',  color: colors.plum },
]

const H_PAD = screenLayout.padH
const GRID_GAP = space[8]

const XP_TO_STATS_GAP = space[24]
/** Green hero tucks under ~half of the stats card (Spotted, Rare, Streak, Badges). */
const STATS_CARD_HERO_OVERLAP = space[40]

const HEATMAP_MONTHS = 12
const HEATMAP_DAYS = 7

const HEAT_DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const HEAT_MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const HEAT_CELL = 10
const HEAT_GAP = 3
const HEAT_DAY_LABEL_W = 30
const HEAT_MONTH_ROW_H = 16

interface SpottingHeatmap {
  monthCount: number
  monthLabels: string[]
  levels: (number | null)[]
}

function mockActivityLevel(year: number, monthIndex: number, dayIndex: number): number {
  const seed = year * 372 + monthIndex * 31 + dayIndex
  const rand = (Math.sin(seed) + 1) / 2
  if (rand < 0.15) return 0
  if (rand < 0.35) return 1
  if (rand < 0.60) return 2
  if (rand < 0.80) return 3
  return 4
}

function buildCurrentYearHeatmap(today: Date): SpottingHeatmap {
  const year = today.getFullYear()
  const currentMonth = today.getMonth()

  const monthLabels = [...HEAT_MONTH_SHORT]

  const levels: (number | null)[] = []
  for (let monthIndex = 0; monthIndex < HEATMAP_MONTHS; monthIndex++) {
    for (let dayIndex = 0; dayIndex < HEATMAP_DAYS; dayIndex++) {
      levels.push(
        monthIndex > currentMonth
          ? null
          : mockActivityLevel(year, monthIndex, dayIndex),
      )
    }
  }

  return { monthCount: HEATMAP_MONTHS, monthLabels, levels }
}

const HEAT_THEME = {
  card: colors.card,
  label: colors.dim,
  total: colors.green,
  future: colors.hairline,
  levels: ['#E7EDF3', '#A7D4BA', '#6BBF98', '#3DA876', colors.green] as const,
}

export function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { displayName, username } = useAccountProfile()
  const xpProgress = XP_CURRENT / XP_NEXT

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GRID_GAP * 2) / 3
  }, [])

  const recentSpots = useMemo(() => getRecentFindDexCards(), [])

  const spottingHeatmap = useMemo(() => buildCurrentYearHeatmap(new Date()), [])

  const handleSeeAllSpots = useCallback(() => {
    router.push('/(tabs)/dex')
  }, [router])

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 + space[24] }}
        showsVerticalScrollIndicator={false}>

        {/* Green hero header */}
        <View style={[styles.hero, { paddingTop: contentTopInset(insets.top) }]}>
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <ProfileAvatar size={72} borderColor={colors.card} borderWidth={3} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>{displayName}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>LVL {LEVEL}</Text>
                </View>
              </View>
              <Text style={styles.handle}>@{username}</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakText}>12-day streak</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="settings-outline" size={22} color={colors.card} />
            </Pressable>
          </View>

          {/* XP bar */}
          <View style={styles.xpCard}>
            <View style={styles.xpLabels}>
              <Text style={styles.xpCurrent}>{XP_CURRENT.toLocaleString()} / {XP_NEXT.toLocaleString()} XP</Text>
              <Text style={styles.xpNext}>{(XP_NEXT - XP_CURRENT).toLocaleString()} to Lvl {LEVEL + 1}</Text>
            </View>
            <View style={styles.xpTrack}>
              <View style={[styles.xpFill, { width: `${xpProgress * 100}%` }]} />
            </View>
          </View>
        </View>

        {/* Stats card */}
        <View style={styles.statsCard}>
          {STATS.map((s, i) => (
            <View key={s.label} style={[styles.statItem, i < STATS.length - 1 && styles.statBorder]}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Recent spots */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent spots</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="See all spots in Wild Dex"
              onPress={handleSeeAllSpots}
              style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.spotsScroll}
            style={styles.spotsScrollWrap}>
            {recentSpots.map((species) => (
              <DexCard
                key={species.id}
                species={species}
                width={colWidth}
                onPress={() =>
                  router.push({
                    pathname: '/species/[id]',
                    params: {
                      id: species.id,
                      name: species.name,
                      number: species.number,
                      kingdom: species.kingdom,
                    },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>

        {/* Spotting activity heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spotting activity</Text>
          <View style={styles.heatCard}>
            <View style={styles.heatHeader}>
              <Text style={styles.heatPeriod}>Current year</Text>
              <Text style={styles.heatTotal}>247 spots</Text>
            </View>

            <View style={styles.heatChart}>
              <View style={styles.heatChartBody}>
                <View style={styles.heatDayLabelsCol}>
                  <View style={{ height: HEAT_MONTH_ROW_H }} />
                  {HEAT_DAY_LABELS.map((dayLabel) => (
                    <View key={dayLabel} style={styles.heatDayLabelCell}>
                      <Text style={[styles.heatAxisLabel, styles.heatDayLabel]}>{dayLabel}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.heatGrid}>
                  <View style={styles.heatMonthRow}>
                    {spottingHeatmap.monthLabels.map((label, monthIndex) => (
                      <Text
                        key={`month-${monthIndex}`}
                        style={[styles.heatAxisLabel, styles.heatMonthLabel]}
                        numberOfLines={1}>
                        {label}
                      </Text>
                    ))}
                  </View>

                  {HEAT_DAY_LABELS.map((dayLabel, dayIndex) => (
                    <View key={dayLabel} style={styles.heatGridRow}>
                      {Array.from({ length: spottingHeatmap.monthCount }, (_, monthIndex) => {
                        const level =
                          spottingHeatmap.levels[monthIndex * HEATMAP_DAYS + dayIndex]
                        const month = spottingHeatmap.monthLabels[monthIndex]
                        const fill =
                          level === null
                            ? HEAT_THEME.future
                            : HEAT_THEME.levels[level]
                        return (
                          <View
                            key={monthIndex}
                            accessibilityLabel={`${dayLabel}, ${month}, ${level === null ? 'no activity yet' : `level ${level}`}`}
                            style={[styles.heatCell, { backgroundColor: fill }]}
                          />
                        )
                      })}
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.heatLegendRow}>
                <View style={{ flex: 1 }} />
                <View style={styles.heatLegend}>
                  <Text style={styles.heatLegendText}>Less</Text>
                  {HEAT_THEME.levels.map((fill, i) => (
                    <View key={i} style={[styles.heatLegendCell, { backgroundColor: fill }]} />
                  ))}
                  <Text style={styles.heatLegendText}>More</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
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
    flexWrap: 'wrap',
  },
  userName: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  levelBadge: {
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
  section: {
    paddingHorizontal: space[16],
    marginTop: space[24],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[16],
  },
  sectionTitle: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.black,
    color: colors.ink,
  },
  seeAll: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  spotsScrollWrap: {
    marginHorizontal: -space[16],
  },
  spotsScroll: {
    paddingHorizontal: space[16],
    gap: GRID_GAP,
  },
  heatCard: {
    backgroundColor: HEAT_THEME.card,
    borderRadius: radius.lg,
    padding: space[16],
    marginTop: space[16],
    ...dexCardHairline,
    ...shadow.card,
  },
  heatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[8],
  },
  heatPeriod: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: HEAT_THEME.label,
  },
  heatTotal: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: HEAT_THEME.total,
  },
  heatChart: {
    gap: space[8],
  },
  heatChartBody: {
    flexDirection: 'row',
  },
  heatDayLabelsCol: {
    width: HEAT_DAY_LABEL_W,
  },
  heatDayLabelCell: {
    flex: 1,
    marginBottom: HEAT_GAP,
    justifyContent: 'center',
  },
  heatDayLabel: {
    textAlign: 'right',
    paddingRight: space[8],
  },
  heatGrid: {
    flex: 1,
  },
  heatMonthRow: {
    flexDirection: 'row',
    height: HEAT_MONTH_ROW_H,
    marginBottom: space[4],
    gap: HEAT_GAP,
  },
  heatMonthLabel: {
    flex: 1,
    textAlign: 'center',
  },
  heatGridRow: {
    flexDirection: 'row',
    gap: HEAT_GAP,
    marginBottom: HEAT_GAP,
  },
  heatAxisLabel: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.medium,
    color: HEAT_THEME.label,
    textAlign: 'center',
  },
  heatCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 2,
  },
  heatLegendRow: {
    flexDirection: 'row',
    marginTop: space[8],
  },
  heatLegend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  heatLegendText: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.medium,
    color: HEAT_THEME.label,
  },
  heatLegendCell: {
    width: HEAT_CELL,
    height: HEAT_CELL,
    borderRadius: 2,
  },
})
