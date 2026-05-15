import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { DexCard } from '@/components/DexCard'
import { mockCreatureOfDay, mockRecentFinds, mockUser, mockWeeklyQuest } from '@/data/mock'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

function Header() {
  const timeHour = new Date().getHours()
  const greeting = timeHour < 12 ? 'Good morning' : timeHour < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarEmoji}>{mockUser.avatar}</Text>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{mockUser.level}</Text>
          </View>
        </View>
        <View>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.name}>Hey, {mockUser.name} 👋</Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <View style={styles.streakPill}>
          <Ionicons name="flame" size={14} color={colors.coral} />
          <Text style={styles.streakText}>{mockUser.streakDays}</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.7}>
          <Ionicons name="notifications-outline" size={20} color={colors.ink} />
          <View style={styles.bellDot} />
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
      colors={[colors.green, colors.greenDark]}
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

function CreatureOfDayCard() {
  const { commonName, scientificName, kingdom, description, bonusXp, gradient } = mockCreatureOfDay
  const router = useRouter()

  return (
    <View style={styles.creatureCard}>
      <LinearGradient
        colors={[...gradient]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.creatureArt}>
        <View style={styles.creatureBadges}>
          <View style={styles.kingdomBadge}>
            <Ionicons name="leaf" size={11} color="#fff" />
            <Text style={styles.kingdomText}>{kingdom.toUpperCase()}</Text>
          </View>
          <View style={styles.featuredBadge}>
            <Ionicons name="star" size={11} color={colors.ink} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        </View>
        <View style={styles.creatureSilhouette}>
          <View style={styles.silhouetteBlob} />
        </View>
      </LinearGradient>

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
          <TouchableOpacity style={styles.infoBtn} activeOpacity={0.7}>
            <Ionicons name="information-circle-outline" size={24} color={colors.ink2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}

function RecentFinds() {
  const CARD_WIDTH = 120

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Recent finds</Text>
          <Text style={styles.sectionSub}>47 spotted · 200 left to discover</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={styles.seeAll}>All &gt;</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.recentScroll}>
        {mockRecentFinds.map((item) => (
          <DexCard
            key={item.id}
            width={CARD_WIDTH}
            species={{
              id: item.id,
              number: item.number,
              name: item.name,
              date: item.date,
              gradient: item.gradient,
            }}
          />
        ))}
      </ScrollView>
    </View>
  )
}

export function SpotHomeScreen() {
  const insets = useSafeAreaInsets()

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + space[8], paddingBottom: 100 + insets.bottom },
      ]}
      showsVerticalScrollIndicator={false}>
      <Header />
      <WeeklyQuestCard />
      <View style={styles.sectionGap}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Creature of the day</Text>
          <Text style={styles.newEvery}>NEW EVERY 24H</Text>
        </View>
        <CreatureOfDayCard />
      </View>
      <RecentFinds />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: space[20],
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
    gap: space[12],
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.sun,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: colors.green,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  levelBadge: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    backgroundColor: colors.green,
    borderRadius: radius.pill,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  levelText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: '#fff',
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
    gap: space[10],
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.coral}18`,
    paddingHorizontal: space[10],
    paddingVertical: space[6],
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
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: colors.card,
  },

  // Quest card
  questCard: {
    borderRadius: radius.xl,
    padding: space[20],
    gap: space[14],
  },
  questTop: {
    gap: space[6],
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
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
    gap: space[10],
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
    gap: space[6],
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
    paddingHorizontal: space[12],
    paddingVertical: space[6],
    borderRadius: radius.pill,
  },
  xpText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '900',
    color: colors.ink,
  },

  // Section
  section: {
    gap: space[12],
  },
  sectionGap: {
    gap: space[10],
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

  // Creature card
  creatureCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  creatureArt: {
    height: 200,
    padding: space[14],
    justifyContent: 'space-between',
  },
  creatureBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kingdomBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: space[10],
    paddingVertical: space[4],
    borderRadius: radius.pill,
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
    paddingHorizontal: space[10],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  featuredText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  creatureSilhouette: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  silhouetteBlob: {
    width: 120,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  creatureInfo: {
    padding: space[16],
    gap: space[10],
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
    gap: space[10],
    marginTop: space[4],
  },
  seeOneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    paddingVertical: space[14],
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
    gap: space[10],
    paddingRight: space[20],
  },
})
