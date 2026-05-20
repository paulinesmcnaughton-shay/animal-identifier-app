import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import {
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  filterAchievementBadges,
  mockAchievementBadges,
  mockBadgeStats,
  mockLatestUnlock,
  type AchievementBadge,
  type BadgeFilterKey,
  type BadgeTier,
} from '@/data/mock-badges'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { badgeImageForTier, type CollectorTier } from '@/lib/collector-tier'

const FILTERS: { key: BadgeFilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bronze', label: 'Bronze' },
  { key: 'silver', label: 'Silver' },
  { key: 'gold', label: 'Gold' },
  { key: 'platinum', label: 'Platinum' },
  { key: 'in_progress', label: 'In Progress' },
]

const GRID_COLUMNS = 3
const GRID_GAP = space[8]
const H_PAD = screenLayout.padH
const SCREEN_W = Dimensions.get('window').width
const BADGE_CARD_W = (SCREEN_W - H_PAD * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS

const TIER_MEDAL: Record<BadgeTier, CollectorTier> = {
  bronze: 'bronze',
  silver: 'silver',
  gold: 'gold',
  platinum: 'gold',
}

function BadgeMedalIcon({
  tier,
  symbol,
  size,
}: {
  tier: BadgeTier
  symbol: keyof typeof Ionicons.glyphMap
  size: number
}) {
  const imageTier = TIER_MEDAL[tier]
  return (
    <View style={[styles.medalWrap, { width: size, height: size }]}>
      <Image
        source={badgeImageForTier(imageTier)}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
      <View style={styles.medalSymbol}>
        <Ionicons name={symbol} size={size * 0.28} color={colors.card} />
      </View>
    </View>
  )
}

function BadgeGridCard({ badge }: { badge: AchievementBadge }) {
  const isInProgress = badge.progressPercent !== undefined

  return (
    <View style={[styles.gridCard, { width: BADGE_CARD_W }]}>
      <BadgeMedalIcon tier={badge.tier} symbol={badge.symbol} size={52} />
      <Text style={styles.gridName} numberOfLines={2}>
        {badge.name}
      </Text>
      {isInProgress ? (
        <View style={styles.progressBlock}>
          <Text style={styles.progressLabel}>{badge.progressPercent}% done</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${badge.progressPercent ?? 0}%` }]} />
          </View>
        </View>
      ) : (
        <Text style={styles.earnedDate}>{badge.earnedDate}</Text>
      )}
    </View>
  )
}

export function BadgesScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState<BadgeFilterKey>('all')

  const filteredBadges = useMemo(
    () => filterAchievementBadges(mockAchievementBadges, activeFilter),
    [activeFilter],
  )

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
          {mockBadgeStats.earned} earned · {mockBadgeStats.remaining} to go
        </Text>

        <View style={styles.latestCard}>
          <BadgeMedalIcon
            tier={mockLatestUnlock.tier}
            symbol={mockLatestUnlock.symbol}
            size={56}
          />
          <View style={styles.latestText}>
            <Text style={styles.latestLabel}>LATEST UNLOCK</Text>
            <Text style={styles.latestName}>{mockLatestUnlock.name}</Text>
            <Text style={styles.latestDetail}>{mockLatestUnlock.detail}</Text>
          </View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + space[24] },
        ]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key
            return (
              <Pressable
                key={filter.key}
                onPress={() => setActiveFilter(filter.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                style={[styles.filterPill, isActive && styles.filterPillActive]}>
                <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.grid}>
          {filteredBadges.map((badge) => (
            <BadgeGridCard key={badge.id} badge={badge} />
          ))}
        </View>
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
    marginBottom: space[16],
  },
  latestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space[16],
    ...shadow.card,
  },
  latestText: {
    flex: 1,
    gap: space[4],
  },
  latestLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.sun,
    letterSpacing: 0.5,
  },
  latestName: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  latestDetail: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    paddingHorizontal: H_PAD,
  },
  gridCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    paddingHorizontal: space[8],
    alignItems: 'center',
    gap: space[8],
    ...shadow.card,
  },
  medalWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalSymbol: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridName: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    textAlign: 'center',
    minHeight: 32,
  },
  earnedDate: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  progressBlock: {
    width: '100%',
    gap: space[4],
    paddingHorizontal: space[4],
  },
  progressLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
    textAlign: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
})
