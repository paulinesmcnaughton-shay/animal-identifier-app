import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { mockHomeNotifications, type HomeNotification } from '@/data/mock'
import { ScreenHeader } from '@/design/atoms/ScreenHeader'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const olderNotifications: HomeNotification[] = [
  {
    id: 'n4',
    title: 'Night Owl bonus',
    message: 'You spotted after sunset · +5 XP',
    timeAgo: 'Yesterday',
    icon: 'flame',
    iconBg: '#FF6B5B',
  },
  {
    id: 'n5',
    title: 'Streak milestone',
    message: '7-day streak — keep it going!',
    timeAgo: '2d ago',
    icon: 'leaf',
    iconBg: '#1a3d2b',
  },
]

function NotificationRow({ item }: { item: HomeNotification }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={18} color={colors.card} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowMessage}>{item.message}</Text>
      </View>
      <Text style={styles.rowTime}>{item.timeAgo}</Text>
    </View>
  )
}

export function NotificationsScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={() => router.back()} title="Notifications" />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + space[24] },
        ]}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>NEW</Text>
        <View style={styles.card}>
          {mockHomeNotifications.map((item, index) => (
            <View key={item.id}>
              <NotificationRow item={item} />
              {index < mockHomeNotifications.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>EARLIER</Text>
        <View style={styles.card}>
          {olderNotifications.map((item, index) => (
            <View key={item.id}>
              <NotificationRow item={item} />
              {index < olderNotifications.length - 1 ? <View style={styles.divider} /> : null}
            </View>
          ))}
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
  scroll: {
    paddingHorizontal: screenLayout.padH,
  },
  sectionLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[8],
    marginTop: space[16],
    marginLeft: space[4],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    paddingHorizontal: space[16],
    paddingVertical: space[16],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginLeft: space[16] + 36 + space[8],
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowText: {
    flex: 1,
    gap: space[4],
    paddingRight: space[4],
  },
  rowTitle: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  rowMessage: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 17,
  },
  rowTime: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
    flexShrink: 0,
    marginTop: space[4],
  },
})
