import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CollectorTierBadge } from '@/components/CollectorTierBadge'
import { DexCard, type DexCardSpecies } from '@/components/DexCard'
import { CreatureInfoOverlay } from '@/components/home/CreatureInfoOverlay'
import { HomeNotificationsPopover } from '@/components/home/HomeNotificationsPopover'
import {
import {
  getRecentFindDexCards,
  getRecentFinds,
  recentFindRouteParams,
} from '@/data/mock'
  mockCreatureOfDay,
  mockHomeNotifications,
  mockUser,
  mockWeeklyQuest,
} from '@/data/mock'
import { dexCardHairline } from '@/design/dex-card-shell'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useAccountProfile } from '@/features/settings/account-profile'

interface HeaderProps {
  firstName: string
  onBadgePress: () => void
  onBellPress: () => void
  hasUnreadNotifications: boolean
}

function Header({ firstName, onBadgePress, onBellPress, hasUnreadNotifications }: HeaderProps) {
  const timeHour = new Date().getHours()
  const greeting = timeHour < 12 ? 'Good morning' : timeHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Pressable
          onPress={onBadgePress}
          accessibilityRole="button"
          accessibilityLabel="View badges">
          <CollectorTierBadge captureCount={mockUser.spotsCaptured} size={52} />
        </Pressable>
        <View style={styles.headerTextCol}>
          <Text style={styles.greeting}>{greeting}</Text>
          <View style={styles.nameRow}>
            <Text style={styles.name}>Hey, {firstName} 👋</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>LVL {mockUser.level}</Text>
            </View>
          </View>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={14} color={colors.coral} />
          <Text style={styles.streakText}>{mockUser.streakDays}</Text>
        </View>
        <TouchableOpacity
          style={styles.bellBtn}
          activeOpacity={0.7}
          onPress={onBellPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications">
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          {hasUnreadNotifications ? (
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>{mockHomeNotifications.length}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  )
}

function WeeklyQuestCard() {
  const { title, daysLeft, current, total, xpReward, progressEmoji } = mockWeeklyQuest
  const pct = current / total

  return (
    <LinearGradient
      colors={[colors.green, colors.greenLight]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.questCard}>
      <View style={styles.questTop}>
        <View style={styles.questTitleRow}>
          <Ionicons name="trophy" size={14} color={colors.sun} />
          <Text style={styles.questLabel}>WEEKLY QUEST · {daysLeft}D LEFT</Text>
        </View>
        <Text style={styles.questTitle}>{title}</Text>
      </View>

      <View style={styles.questBottom}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${pct * 100}%` }]} />
        </View>
        <View style={styles.questMeta}>
          <View style={styles.progressEmojis}>
            <Text style={styles.progressLabel}>PROGRESS:</Text>
            {progressEmoji.map((e, i) => (
              <View key={i} style={styles.emojiCircle}>
                <Text style={styles.emojiText}>{e}</Text>
              </View>
            ))}
            <View style={[styles.emojiCircle, styles.emojiCircleEmpty]}>
              <Ionicons name="add" size={16} color="rgba(255,255,255,0.5)" />
            </View>
          </View>
          <View style={styles.xpPill}>
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  )
}

interface CreatureOfDayCardProps {
  onInfoPress: () => void
}

function CreatureOfDayCard({ onInfoPress }: CreatureOfDayCardProps) {
  const { commonName, scientificName, kingdom, description, bonusXp, heroImage } = mockCreatureOfDay
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

function RecentFinds() {
  const router = useRouter()
  const CARD_WIDTH = 120
  const recentFinds = getRecentFindDexCards()

  const handleOpenSpecies = (species: DexCardSpecies) => {
    const item = getRecentFinds().find((find) => find.id === species.id)
    router.push({
      pathname: '/species/[id]',
      params: item ? recentFindRouteParams(item) : {
        id: species.id,
        name: species.name,
        number: species.number,
        kingdom: species.kingdom,
      },
    })
  }

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent finds</Text>
          <Text style={styles.sectionSub}>47 spotted · 200 left to discover</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel="View all recent finds in Dex"
          onPress={() => router.navigate('/dex')}>
          <Text style={styles.seeAll}>View all</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentScroll}>
        {recentFinds.map((species) => (
          <DexCard
            key={species.id}
            width={CARD_WIDTH}
            species={species}
            onPress={() => handleOpenSpecies(species)}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export function SpotHomeScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { firstName } = useAccountProfile()
  const [creatureInfoOpen, setCreatureInfoOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true)

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
          firstName={firstName}
          onBadgePress={handleOpenBadges}
          onBellPress={handleOpenNotifications}
          hasUnreadNotifications={hasUnreadNotifications}
        />
        <WeeklyQuestCard />
        <View style={styles.sectionGap}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Creature of the day</Text>
            <Text style={styles.newEvery}>NEW EVERY 24H</Text>
          </View>
          <CreatureOfDayCard onInfoPress={() => setCreatureInfoOpen(true)} />
        </View>
        <RecentFinds />
      </ScrollView>

      <CreatureInfoOverlay
        visible={creatureInfoOpen}
        creature={mockCreatureOfDay}
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
  bellBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 16,
    height: 16,
    borderRadius: radius.pill,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
  },

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
  emojiText: {
    fontSize: 16,
  },
  xpPill: {
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
  recentScroll: {
    gap: space[8],
    paddingRight: screenLayout.padH,
  },
})
