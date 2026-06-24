import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { HomeBadge } from '@/components/home/HomeBadge'
import { RecentSpotsSection } from '@/components/profile/RecentSpotsSection'
import { CreatureInfoOverlay } from '@/components/home/CreatureInfoOverlay'
import { HomeNotificationsPopover } from '@/components/home/HomeNotificationsPopover'
import { useCreatureOfWeek } from '@/features/home/creature-of-week'
import type { CreatureRosterItem } from '@/features/home/creature-of-week'
import { useCollectionLookup } from '@/features/collections/collections'
import {
  buildQuestProgress,
  questCountsFromSightings,
  type QuestProgress,
} from '@/features/quests/quests'
import { dexCardHairline } from '@/design/dex-card-shell'
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
  spotsCaptured: number
  onBadgePress: () => void
  onBellPress: () => void
  hasUnreadNotifications: boolean
}

function Header({
  greeting,
  firstName,
  level,
  streakDays,
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
          <HomeBadge spotsCaptured={spotsCaptured} streakDays={streakDays} size={52} />
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
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={14} color={colors.coral} />
          <Text style={styles.streakText}>{streakDays}</Text>
        </View>
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

interface QuestsCarouselProps {
  quests: QuestProgress[]
}

function QuestsCarousel({ quests }: QuestsCarouselProps) {
  const { width } = useWindowDimensions()
  const cardWidth = width - screenLayout.padH * 2 - space[24]
  const snap = cardWidth + space[8]
  const [activeIndex, setActiveIndex] = useState(0)

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

interface QuestCardProps {
  progress: QuestProgress
  width: number
}

function QuestCard({ progress, width }: QuestCardProps) {
  const { quest, count, badgeEarned, bonusEarned } = progress
  const pct = Math.min(count, quest.bonusTarget) / quest.bonusTarget
  const reward = bonusEarned ? `+${quest.bonusXp} XP` : badgeEarned ? 'Badge earned' : `+${quest.xpReward} XP`

  return (
    <View style={[styles.questCard, { width, backgroundColor: quest.accent }]}>
      <View style={styles.questTop}>
        <View style={styles.questTitleRow}>
          <Ionicons name="trophy" size={14} color={colors.sun} />
          <Text style={styles.questLabel}>QUEST</Text>
        </View>
        <Text style={styles.questTitle}>{quest.title}</Text>
      </View>

      <View style={styles.questBottom}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct * 100}%` }]} />
        </View>
        <View style={styles.questMeta}>
          <View style={styles.progressEmojis}>
            {Array.from({ length: quest.bonusTarget }).map((_, i) => {
              const filled = i < count
              const isBonusSlot = i === quest.bonusTarget - 1
              return (
                <View
                  key={i}
                  style={[
                    styles.emojiCircle,
                    !filled && styles.emojiCircleEmpty,
                    isBonusSlot && styles.emojiCircleBonus,
                    isBonusSlot && filled && styles.emojiCircleBonusFilled,
                  ]}>
                  {filled ? (
                    <Text style={styles.emojiText}>{isBonusSlot ? '⭐️' : quest.emoji}</Text>
                  ) : (
                    <Ionicons
                      name={isBonusSlot ? 'star-outline' : 'add'}
                      size={16}
                      color="rgba(255,255,255,0.5)"
                    />
                  )}
                </View>
              )
            })}
          </View>
          <View style={styles.xpPill}>
            {badgeEarned ? <Ionicons name="ribbon" size={13} color={colors.ink} /> : null}
            <Text style={styles.xpText}>{reward}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

interface CreatureOfWeekCardProps {
  creature: CreatureRosterItem
  onInfoPress: () => void
}

function CreatureOfWeekCard({ creature, onInfoPress }: CreatureOfWeekCardProps) {
  const { commonName, scientificName, kingdom, description, bonusXp, heroImage } = creature
  const router = useRouter()

  return (
    <View style={styles.creatureCardOuter}>
      <View style={styles.creatureCard}>
      <View style={styles.creatureArt}>
        <Image source={heroImage} style={StyleSheet.absoluteFill} contentFit="cover" />
        <View style={styles.creatureBadges}>
          <View style={styles.kingdomBadge}>
            <Text style={styles.kingdomEmoji}>🦎</Text>
            <Text style={styles.kingdomText}>{kingdom.toUpperCase()}</Text>
          </View>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={11} color={colors.ink} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        </View>
      </View>

      <View style={styles.creatureInfo}>
        <View style={styles.creatureNameRow}>
          <View style={styles.creatureNameCol}>
            <Text style={styles.creatureName}>{commonName}</Text>
            <Text style={styles.creatureScientific}>{scientificName}</Text>
          </View>
          <View>
            <Text style={styles.bonusLabel}>BONUS</Text>
            <Text style={styles.bonusXp}>+{bonusXp} XP</Text>
          </View>
        </View>
        <Text style={styles.creatureDesc}>{description}</Text>
        <View style={styles.creatureActions}>
          <TouchableOpacity
            style={styles.seeOneBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/capture/scan' as never)}>
            <Ionicons name="scan-circle-outline" size={20} color="#fff" />
            <Text style={styles.seeOneBtnText}>I SEE ONE!</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.infoBtn}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`More about ${commonName}`}
            onPress={onInfoPress}>
            <Ionicons name="information-circle-outline" size={24} color={colors.ink2} />
          </TouchableOpacity>
        </View>
      </View>
      </View>
    </View>
  )
}

export function SpotHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { firstName, timeZone, level, streakDays, spotsCaptured, isReady, isLoading } =
    useAccountProfile()
  const { recentCards, dexEntries } = useUserSightingsData()
  const collectionLookup = useCollectionLookup()
  const quests = useMemo(
    () =>
      buildQuestProgress(
        questCountsFromSightings(
          dexEntries.map((e) => ({
            kingdom: e.kingdom,
            dexNumber: e.number,
            speciesId: e.id,
            speciesName: e.name,
            scientificName: e.latin ?? null,
          })),
          collectionLookup,
        ),
      ),
    [dexEntries, collectionLookup],
  )
  const greeting = useSpotGreeting(timeZone)
  const creatureOfWeek = useCreatureOfWeek()
  const [creatureInfoOpen, setCreatureInfoOpen] = useState(false)
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
          streakDays={streakDays}
          spotsCaptured={spotsCaptured}
          onBadgePress={handleOpenBadges}
          onBellPress={handleOpenNotifications}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        <QuestsCarousel quests={quests} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Explore venues"
          onPress={() => router.push('/venues')}
          style={({ pressed }) => [styles.venuesCard, pressed && styles.venuesCardPressed]}>
          <Text style={styles.venuesEmoji}>🦒</Text>
          <View style={styles.venuesText}>
            <Text style={styles.venuesTitle}>Explore venues</Text>
            <Text style={styles.venuesSub}>Zoos, aquariums &amp; safari parks</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.dim} />
        </Pressable>
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Creature of the week</Text>
            <Text style={styles.newEvery}>NEW EVERY WEEK</Text>
          </View>
          <CreatureOfWeekCard creature={creatureOfWeek} onInfoPress={() => setCreatureInfoOpen(true)} />
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
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.coral}18`,
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  streakText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '800',
    color: colors.coral,
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
  // Quest card
  questCard: {
    borderRadius: radius.xl,
    padding: space[16],
    gap: space[16],
  },
  questTop: {
    gap: space[8],
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  questLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  questTitle: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 28,
  },
  questBottom: {
    gap: space[8],
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.sun,
    borderRadius: radius.pill,
  },
  questMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressEmojis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  progressLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginRight: 2,
  },
  emojiCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiCircleEmpty: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  emojiCircleBonus: {
    borderWidth: 1.5,
    borderColor: colors.sun,
    borderStyle: 'solid',
  },
  emojiCircleBonusFilled: {
    backgroundColor: 'rgba(255,201,60,0.35)',
  },
  emojiText: {
    fontSize: 16,
  },
  xpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.sun,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  xpText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '900',
    color: colors.ink,
  },

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
  seeAll: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '800',
    color: colors.green,
  },

  // Creature of the day — outer shell casts shadow; inner clips image corners
  creatureCardOuter: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    ...shadow.featured,
  },
  creatureCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
    ...dexCardHairline,
  },
  creatureArt: {
    height: 200,
    padding: space[16],
    justifyContent: 'space-between',
    overflow: 'hidden',
    backgroundColor: colors.hairline,
  },
  creatureBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  kingdomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  kingdomEmoji: {
    fontSize: 11,
  },
  kingdomText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sun,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  featuredText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  creatureInfo: {
    padding: space[16],
    gap: space[8],
  },
  creatureNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  creatureNameCol: {
    flex: 1,
    gap: 2,
  },
  creatureName: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: '800',
    color: colors.ink,
  },
  creatureScientific: {
    fontSize: typeTokens.size.bodySM,
    fontStyle: 'italic',
    color: colors.dim,
  },
  bonusLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.dim,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  bonusXp: {
    fontSize: typeTokens.size.bodyLG,
    fontWeight: '900',
    color: colors.coral,
    textAlign: 'right',
  },
  creatureDesc: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '500',
    color: colors.ink2,
    lineHeight: 20,
  },
  creatureActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginTop: space[4],
  },
  seeOneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    paddingVertical: space[16],
    borderRadius: radius.lg,
  },
  seeOneBtnText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: 0.5,
  },
  infoBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Recent finds
})
