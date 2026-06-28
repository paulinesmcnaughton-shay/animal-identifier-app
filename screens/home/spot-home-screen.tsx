import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HomeBadge } from '@/components/home/HomeBadge'
import { CreatureStamp } from '@/components/home/CreatureStamp'
import { QuestCard } from '@/components/home/QuestCard'
import { DexpanionCard } from '@/components/home/DexpanionCard'
import { ExploreVenuesCard } from '@/components/home/ExploreVenuesCard'
import { StreakCalendar, localDateKey } from '@/components/home/StreakCalendar'
import { CreatureInfoOverlay } from '@/components/home/CreatureInfoOverlay'
import { HomeNotificationsPopover } from '@/components/home/HomeNotificationsPopover'
import { useCreatureOfWeek, useCreatureWeekMeta } from '@/features/home/creature-of-week'
import { claimCreatureBonus } from '@/features/home/claim-creature-bonus'
import { addNotification, useNotifications } from '@/features/notifications/notifications'
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
  streakDays: number
  onBadgePress: () => void
  onBellPress: () => void
  hasUnreadNotifications: boolean
}

function Header({
  greeting,
  firstName,
  level,
  streakDays,
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
        {streakDays > 0 ? (
          <View style={styles.streakChip}>
            <Text style={styles.streakChipText}>🔥 {streakDays}</Text>
          </View>
        ) : null}
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
  const cardWidth = width - screenLayout.padH * 2
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
  const { firstName, timeZone, level, streakDays, claimedQuests, isReady, isLoading } =
    useAccountProfile()
  const { rows } = useUserSightingsData()
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
        })),
        { lookup: collectionLookup, streakDays },
      ),
    )
    return visibleQuests(progress, claimedQuests, MAX_VISIBLE_QUESTS)
  }, [rows, collectionLookup, streakDays, claimedQuests])
  const greeting = useSpotGreeting(timeZone)
  const creatureOfWeek = useCreatureOfWeek()
  const weekMeta = useCreatureWeekMeta()
  const isCreatureCollected = useMemo(() => {
    const cid = creatureOfWeek.id.toLowerCase()
    const cname = creatureOfWeek.commonName.trim().toLowerCase()
    const cdex = creatureOfWeek.dexNumber.replace(/^#/, '')
    return rows.some(
      (r) =>
        (r.species_id ?? '').toLowerCase() === cid ||
        (r.species_name ?? '').trim().toLowerCase() === cname ||
        (r.dex_number ?? '').replace(/^#/, '') === cdex,
    )
  }, [rows, creatureOfWeek])
  const { unreadCount } = useNotifications()
  useEffect(() => {
    void addNotification({
      title: 'New Creature of the Week!',
      body: `${creatureOfWeek.commonName} is featured this week`,
      icon: 'leaf',
      dedupeKey: `feature-${weekMeta.key}`,
    })
  }, [weekMeta.key, creatureOfWeek.commonName])
  const isCreatureClaimed = claimedQuests.includes(weekMeta.key)
  const handleCollectCreature = useCallback(() => {
    void claimCreatureBonus({ weekKey: weekMeta.key, bonusXp: creatureOfWeek.bonusXp })
  }, [weekMeta.key, creatureOfWeek.bonusXp])
  const [creatureInfoOpen, setCreatureInfoOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)

  if (isLoading || !isReady) {
    return (
      <View style={[styles.screen, styles.loadingScreen, { paddingTop: contentTopInset(insets.top) }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const handleOpenNotifications = () => {
    setNotificationsOpen(true)
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
          streakDays={streakDays}
          onBadgePress={handleOpenBadges}
          onBellPress={handleOpenNotifications}
          hasUnreadNotifications={unreadCount > 0}
        />
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your quests</Text>
            <Text style={styles.newEvery}>
              {quests.length > 0 ? `SWIPE · ${quests.length} ACTIVE` : 'ALL DONE'}
            </Text>
          </View>
          <QuestsCarousel quests={quests} />
        </View>
        <StreakCalendar streakDays={streakDays} sightingDates={sightingDates} />
        <ExploreVenuesCard />
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Creature of the week</Text>
            <Text style={styles.newEvery}>NEW EVERY WEEK</Text>
          </View>
          <CreatureStamp
            creature={creatureOfWeek}
            isCollected={isCreatureCollected}
            isClaimed={isCreatureClaimed}
            week={weekMeta.week}
            year={weekMeta.year}
            onCollect={handleCollectCreature}
            onInfoPress={() => setCreatureInfoOpen(true)}
          />
        </View>
        <View style={styles.dexpanionGap}>
          <DexpanionCard />
        </View>
      </ScrollView>

      <CreatureInfoOverlay
        visible={creatureInfoOpen}
        creature={creatureOfWeek}
        onClose={() => setCreatureInfoOpen(false)}
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
    backgroundColor: colors.forest,
    borderRadius: radius.sm,
    paddingHorizontal: space[8],
    paddingVertical: 2,
  },
  levelText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
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
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.flameSoft,
    borderRadius: radius.pill,
    paddingHorizontal: space[8],
    paddingVertical: space[8],
  },
  streakChipText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.flame,
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
    marginHorizontal: -screenLayout.padH,
  },
  questCarousel: {
    gap: space[8],
    paddingHorizontal: screenLayout.padH,
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
  dexpanionGap: {
    marginTop: space[16],
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
  seeAll: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '800',
    color: colors.green,
  },

})
