import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { OnboardingSpeciesArt } from '@/screens/onboarding/onboarding-species-art'

const XP_CURRENT = 2340
const XP_NEXT = 3000
const LEVEL = 14

const STATS = [
  { value: '47', label: 'Spotted', color: colors.green },
  { value: '8',  label: 'Rare',    color: colors.sun },
  { value: '12', label: 'Streak',  color: colors.coral },
  { value: '23', label: 'Badges',  color: colors.plum },
]

const RECENT_SPOTS = [
  { kind: 'fox'      as const, name: 'Red Fox',            when: 'Today' },
  { kind: 'monarch'  as const, name: 'Monarch Butter...', when: 'Yesterday' },
  { kind: 'cardinal' as const, name: 'Northern Cardin...', when: '2d ago' },
  { kind: 'frog'     as const, name: 'Tree Frog',          when: '3d ago' },
]

const HEATMAP_WEEKS = 12
const HEATMAP_DAYS  = 7
const HEATMAP_DATA  = Array.from({ length: HEATMAP_WEEKS * HEATMAP_DAYS }, () => {
  const rand = Math.random()
  if (rand < 0.15) return 0
  if (rand < 0.35) return 1
  if (rand < 0.60) return 2
  if (rand < 0.80) return 3
  return 4
})

const HEAT_COLORS = ['#E7EDF3', '#A7D4BA', '#6BBF98', '#3DA876', colors.green]

export function ProfileScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const xpProgress = XP_CURRENT / XP_NEXT

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 60 + space[40] }}
        showsVerticalScrollIndicator={false}>

        {/* Green hero header */}
        <View style={[styles.hero, { paddingTop: insets.top + space[12] }]}>
          <View style={styles.heroNav}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              onPress={() => router.push('/settings')}
              style={({ pressed }) => [styles.navBtn, pressed && { opacity: 0.7 }]}>
              <Ionicons name="settings-outline" size={22} color={colors.card} />
            </Pressable>
          </View>

          {/* Avatar + user info */}
          <View style={styles.userRow}>
            <View style={styles.avatarWrap}>
              <OnboardingSpeciesArt kind="fox" size={72} rounded={18} />
            </View>
            <View style={styles.userInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.userName}>Alex Riley</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>LVL {LEVEL}</Text>
                </View>
              </View>
              <Text style={styles.handle}>@alexinthewild</Text>
              <View style={styles.streakRow}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakText}>12-day streak</Text>
              </View>
            </View>
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
            <Pressable accessibilityRole="button" accessibilityLabel="See all spots">
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.spotsScroll}>
            {RECENT_SPOTS.map((spot) => (
              <View key={spot.name} style={styles.spotCard}>
                <View style={styles.spotArt}>
                  <OnboardingSpeciesArt kind={spot.kind} size={120} rounded={12} />
                </View>
                <Text style={styles.spotName}>{spot.name}</Text>
                <Text style={styles.spotWhen}>{spot.when}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Spotting activity heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spotting activity</Text>
          <View style={styles.heatCard}>
            <View style={styles.heatHeader}>
              <Text style={styles.heatPeriod}>Last {HEATMAP_WEEKS} weeks</Text>
              <Text style={styles.heatTotal}>247 spots</Text>
            </View>
            <View style={styles.heatGrid}>
              {Array.from({ length: HEATMAP_WEEKS }, (_, w) => (
                <View key={w} style={styles.heatCol}>
                  {Array.from({ length: HEATMAP_DAYS }, (_, d) => {
                    const level = HEATMAP_DATA[w * HEATMAP_DAYS + d]
                    return (
                      <View
                        key={d}
                        style={[styles.heatCell, { backgroundColor: HEAT_COLORS[level] }]}
                      />
                    )
                  })}
                </View>
              ))}
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
    paddingHorizontal: space[20],
    paddingBottom: space[32],
  },
  heroNav: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: space[20],
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[16],
    marginBottom: space[20],
  },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.sun,
  },
  userInfo: {
    flex: 1,
    paddingTop: space[4],
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
    padding: space[14],
    gap: space[10],
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
    marginTop: -space[20],
    paddingVertical: space[20],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
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
    marginTop: space[28],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[14],
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
  spotsScroll: {
    gap: space[12],
    paddingRight: space[4],
  },
  spotCard: {
    width: 140,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  spotArt: {
    width: '100%',
    height: 120,
  },
  spotName: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    paddingHorizontal: space[10],
    paddingTop: space[8],
  },
  spotWhen: {
    fontSize: typeTokens.size.caption,
    color: colors.dim,
    paddingHorizontal: space[10],
    paddingBottom: space[10],
    paddingTop: 2,
  },
  heatCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space[16],
    marginTop: space[12],
  },
  heatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[12],
  },
  heatPeriod: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  heatTotal: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  heatGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  heatCol: {
    flex: 1,
    gap: 4,
  },
  heatCell: {
    aspectRatio: 1,
    borderRadius: 3,
  },
})
