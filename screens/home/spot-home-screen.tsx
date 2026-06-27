import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HomeBadge } from '@/components/home/HomeBadge'
import { CreatureStamp } from '@/components/home/CreatureStamp'
import { QuestCard } from '@/components/home/QuestCard'
import { DailyChestCard } from '@/components/home/DailyChestCard'
import { ExploreVenuesCard } from '@/components/home/ExploreVenuesCard'
import { RewardChest } from '@/components/home/RewardChest'
import { StreakCalendar, localDateKey } from '@/components/home/StreakCalendar'
import { RecentSpotsSection } from '@/components/profile/RecentSpotsSection'
import { CreatureInfoOverlay } from '@/components/home/CreatureInfoOverlay'
import { HomeNotificationsPopover } from '@/components/home/HomeNotificationsPopover'
import { useCreatureOfWeek } from '@/features/home/creature-of-week'
import { useCollectionLookup } from '@/features/collections/collections'
import {
  buildQuestProgress,
  questCountsFromSightings,
  visibleQuests,
  type QuestProgress,
} from '@/features/quests/quests'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import type { DayPeriodGreeting } from '@/features/profile/time-greeting'
import { useSpotGreeting } from '@/features/profile/use-spot-greeting'
import { useAccountProfile } from '@/features/settings/account-profile'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'

interface HeaderProps {
  greeting: DayPeriodGreeting
  firstName: string
  level: number
  spotsCaptured: number
  onBadgePress: () => void
  onBellPress: () => void
  hasUnreadNotifications: boolean
}

function Header({
  greeting,
  firstName,
  level,
  spotsCaptured,
  onBadgePress,
  onBellPress,
  hasUnreadNotifications,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable
          onPress={onBadgePress}
          accessibilityRole="button"
          accessibilityLabel="View badges">
          <HomeBadge size={52} />
        </Pressable>
        <View style={styles.headerTextCol}>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {firstName.trim() ? `Hey, ${firstName} 👋` : 'Hey there 👋'}
            </Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL {level}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity
          style={styles.bellBtn}
          activeOpacity={0.7}
          onPress={onBellPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          {hasUnreadNotifications ? <View style={styles.bellDot} /> : null}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const MAX_VISIBLE_QUESTS = 8

interface QuestsCarouselProps {
  quests: QuestProgress[]
}

function QuestsCarousel({ quests }: QuestsCarouselProps) {
  const { width } = useWindowDimensions()
  const cardWidth = width - screenLayout.padH * 2 - space[24]
  const snap = cardWidth + space[8]
  const [activeIndex, setActiveIndex] = useState(0)

  if (quests.length === 0)
    return (
      <View style={styles.questsEmpty}>
        <Text style={styles.questsEmojiBig}>🎉</Text>
        <Text style={styles.questsEmptyTitle}>All quests complete!</Text>
        <Text style={styles.questsEmptySub}>Fresh ones are on the way — keep spotting.</Text>
      </View>
    )

  return (
    <View style={styles.questCarouselWrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snap}
        snapToAlignment="start"
        scrollEventThrottle={16}
        onScroll={(e) => {
          const i = Math.round(e.nativeEvent.contentOffset.x / snap)
          if (i !== activeIndex) setActiveIndex(Math.max(0, Math.min(i, quests.length - 1)))
        }}
        contentContainerStyle={styles.questCarousel}>
        {quests.map((progress) => (
          <QuestCard key={progress.quest.id} progress={progress} width={cardWidth} />
        ))}
      </ScrollView>
      <View style={styles.dots}>
        {quests.map((progress, i) => (
          <View key={progress.quest.id} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  )
}

export function SpotHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { firstName, timeZone, level, streakDays, spotsCaptured, claimedQuests, isReady, isLoading } =
    useAccountProfile()
  const { recentCards, rows } = useUserSightingsData()
  const sightingDates = useMemo(
    () => new Set(rows.map((r) => localDateKey(new Date(r.spotted_at)))),
    [rows],
  )
  const collectionLookup = useCollectionLookup()
  const quests = useMemo(() => {
    const progress = buildQuestProgress(
      questCountsFromSightings(
        rows.map((r) => ({
          kingdom: r.kingdom,
          dexNumber: r.dex_number,
          speciesId: r.species_id,
          speciesName: r.species_name,
          scientificName: r.latin_name,
          spottedAt: r.spotted_at,
        })),
        { lookup: collectionLookup, streakDays },
      ),
    )
    return visibleQuests(progress, claimedQuests, MAX_VISIBLE_QUESTS)
  }, [rows, collectionLookup, streakDays, claimedQuests])
  const greeting = useSpotGreeting(timeZone)
  const creatureOfWeek = useCreatureOfWeek()
  const [creatureInfoOpen, setCreatureInfoOpen] = useState(false)
  const [rewardOpen, setRewardOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)

  if (isLoading || !isReady) {
    return (
      <View style={[styles.screen, styles.loadingScreen, { paddingTop: contentTopInset(insets.top) }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const handleOpenNotifications = () => {
    setNotificationsOpen(true)
    setHasUnreadNotifications(false)
  }

  const handleViewAllNotifications = () => {
    setNotificationsOpen(false)
    router.push('/notifications')
  }

  const handleOpenBadges = () => {
    router.push('/badges')
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.root}
        contentContainerStyle={[
          styles.content,
          { paddingTop: contentTopInset(insets.top), paddingBottom: 100 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <Header
          greeting={greeting}
          firstName={firstName}
          level={level}
          spotsCaptured={spotsCaptured}
          onBadgePress={handleOpenBadges}
          onBellPress={handleOpenNotifications}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        <StreakCalendar streakDays={streakDays} sightingDates={sightingDates} />
        <QuestsCarousel quests={quests} />
        <ExploreVenuesCard />
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Creature of the week</Text>
            <Text style={styles.newEvery}>NEW EVERY WEEK</Text>
          </View>
          <CreatureStamp creature={creatureOfWeek} onInfoPress={() => setCreatureInfoOpen(true)} />
        </View>
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Daily chest</Text>
            <Text style={styles.chestReady}>{`READY · DAY ${Math.max(streakDays, 1)}`}</Text>
          </View>
          <DailyChestCard onOpen={() => setRewardOpen(true)} />
        </View>
        <RecentSpotsSection
          title="Recent finds"
          spotsCaptured={spotsCaptured}
          recentCards={recentCards}
          cardWidth={120}
          horizontalPadding={screenLayout.padH}
        />
      </ScrollView>

      <CreatureInfoOverlay
        visible={creatureInfoOpen}
        creature={creatureOfWeek}
        onClose={() => setCreatureInfoOpen(false)}
      />

      <RewardChest
        visible={rewardOpen}
        day={Math.max(streakDays, 1)}
        onAddToDex={() => setRewardOpen(false)}
        onDismiss={() => setRewardOpen(false)}
      />

      <HomeNotificationsPopover
        visible={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onViewAll={handleViewAllNotifications}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingScreen: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: screenLayout.padH,
    gap: space[24],
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  headerTextCol: {
    gap: space[4],
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    flexWrap: 'wrap',
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
  greeting: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: typeTokens.size.title,
    fontWeight: '800',
    color: colors.ink,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bellDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.card,
  },

  // Quest carousel
  questCarouselWrap: {
    gap: space[8],
  },
  questCarousel: {
    gap: space[8],
    paddingRight: space[24],
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[4],
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.hairline,
  },
  dotActive: {
    backgroundColor: colors.green,
    width: 18,
  },
  questsEmpty: {
    marginHorizontal: screenLayout.padH,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: space[32],
    paddingHorizontal: space[24],
    alignItems: 'center',
    gap: space[4],
    ...shadow.card,
  },
  questsEmojiBig: {
    fontSize: 32,
  },
  questsEmptyTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: '800',
    color: colors.ink,
  },
  questsEmptySub: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '600',
    color: colors.dim,
    textAlign: 'center',
  },
  venuesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space[16],
  },
  venuesCardPressed: { opacity: 0.9 },
  venuesEmoji: { fontSize: 28 },
  venuesText: { flex: 1, gap: space[4] },
  venuesTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  venuesSub: { fontSize: typeTokens.size.bodySM, color: colors.dim },

  // Section
  section: {
    gap: space[16],
  },
  sectionGap: {
    gap: space[8],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: typeTokens.size.bodyLG,
    fontWeight: '800',
    color: colors.ink,
  },
  sectionSub: {
    fontSize: typeTokens.size.caption,
    fontWeight: '600',
    color: colors.dim,
    marginTop: 2,
  },
  newEvery: {
    fontSize: typeTokens.size.caption,
    fontWeight: '800',
    color: colors.green,
    letterSpacing: 0.4,
  },
  chestReady: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.flame,
    letterSpacing: 0.8,
  },
  seeAll: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '800',
    color: colors.green,
  },

})
