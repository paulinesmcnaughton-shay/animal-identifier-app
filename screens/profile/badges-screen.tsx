import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { BADGES, type Badge, type BadgeGroup } from '@/data/badges'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { earnedBadgeIds } from '@/features/achievements/badge-earned'
import { markBadgesSeen } from '@/features/achievements/badge-progress'
import { useAccountProfile } from '@/features/settings/account-profile'

type BadgeFilter = 'all' | 'earned' | 'locked'

const FILTERS: { key: BadgeFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'earned', label: 'Earned' },
  { key: 'locked', label: 'Locked' },
]

const GROUP_ORDER: BadgeGroup[] = [
  'milestones',
  'species',
  'streaks',
  'places',
  'collection',
  'explorer',
]

const GROUP_LABEL: Record<BadgeGroup, string> = {
  milestones: 'Milestones',
  species: 'Species',
  streaks: 'Streaks',
  places: 'Places',
  collection: 'Collection',
  explorer: 'Explorer',
}

const GRID_COLUMNS = 3
const GRID_GAP = space[8]
const H_PAD = screenLayout.padH
const SCREEN_W = Dimensions.get('window').width
const BADGE_CARD_W = (SCREEN_W - H_PAD * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

const BadgeCard = ({ badge, earned }: { badge: Badge; earned: boolean }) => {
  return (
    <View style={[styles.card, { width: BADGE_CARD_W }]}>
      <View style={[styles.imageWrap, !earned && styles.imageLocked]}>
        <Image source={badge.image} style={styles.image} contentFit="contain" />
        {!earned ? (
          <View style={styles.lockChip}>
            <Ionicons name="lock-closed" size={11} color={colors.card} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.name, !earned && styles.nameLocked]} numberOfLines={2}>
        {badge.name}
      </Text>
    </View>
  )
}

export function BadgesScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { spotsCaptured, streakDays } = useAccountProfile()
  const [filter, setFilter] = useState<BadgeFilter>('all')

  const earned = useMemo(
    () => earnedBadgeIds(BADGES, { spotsCaptured, streakDays }),
    [spotsCaptured, streakDays],
  )

  // Opening this screen clears the "new badge" highlight on the home screen.
  useEffect(() => {
    void markBadgesSeen({ spotsCaptured, streakDays })
  }, [spotsCaptured, streakDays])

  const sections = useMemo(() => {
    const visible = BADGES.filter((b) => {
      if (filter === 'earned') return earned.has(b.id)
      if (filter === 'locked') return !earned.has(b.id)
      return true
    })
    return GROUP_ORDER.map((group) => ({
      group,
      items: visible.filter((b) => b.group === group),
    })).filter((s) => s.items.length > 0)
  }, [filter, earned])

  const earnedCount = earned.size
  const remaining = BADGES.length - earnedCount

  return (
    <View style={styles.screen}>
      <View style={[styles.hero, { paddingTop: contentTopInset(insets.top) }]}>
        <View style={styles.heroTopRow}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}>
            <Ionicons name="arrow-back" size={22} color={colors.card} />
          </Pressable>
          <Pressable
            onPress={() => {}}
            accessibilityRole="button"
            accessibilityLabel="Share badges"
            style={({ pressed }) => [styles.iconCircle, pressed && styles.iconCirclePressed]}>
            <Ionicons name="share-outline" size={20} color={colors.card} />
          </Pressable>
        </View>

        <Text style={styles.heroTitle}>Badges</Text>
        <Text style={styles.heroSub}>
          {earnedCount} earned · {remaining} to go
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space[24] }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map((f) => {
            const isActive = filter === f.key
            return (
              <Pressable
                key={f.key}
                onPress={() => setFilter(f.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[styles.filterPill, isActive && styles.filterPillActive]}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {f.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        {sections.map((section) => (
          <View key={section.group} style={styles.section}>
            <Text style={styles.sectionTitle}>{GROUP_LABEL[section.group]}</Text>
            <View style={styles.grid}>
              {section.items.map((badge) => (
                <BadgeCard key={badge.id} badge={badge} earned={earned.has(badge.id)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  hero: {
    backgroundColor: colors.sun,
    paddingHorizontal: H_PAD,
    paddingBottom: space[16],
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[16],
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(21, 33, 48, 0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePressed: {
    opacity: 0.75,
  },
  heroTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayLG,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.5,
    marginBottom: space[4],
  },
  heroSub: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  scroll: {
    paddingTop: space[16],
  },
  filterRow: {
    paddingHorizontal: H_PAD,
    gap: space[8],
    paddingBottom: space[16],
  },
  filterPill: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  filterPillActive: {
    backgroundColor: colors.ink,
  },
  filterText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  filterTextActive: {
    color: colors.card,
  },
  section: {
    paddingHorizontal: H_PAD,
    marginBottom: space[24],
  },
  sectionTitle: {
    fontSize: typeTokens.size.displaySM,
    fontFamily: typeTokens.display.family,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    marginBottom: space[16],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  card: {
    alignItems: 'center',
    gap: space[8],
    marginBottom: space[8],
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageLocked: {
    opacity: 0.4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockChip: {
    position: 'absolute',
    bottom: 6,
    right: '24%',
    width: 20,
    height: 20,
    borderRadius: radius.pill,
    backgroundColor: colors.ink2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    textAlign: 'center',
    minHeight: 32,
  },
  nameLocked: {
    color: colors.dim,
  },
})
