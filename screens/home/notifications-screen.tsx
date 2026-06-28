import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/design/atoms/ScreenHeader'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { notificationBg } from '@/features/notifications/notification-visuals'
import {
  formatTimeAgo,
  markAllNotificationsRead,
  useNotifications,
  type WildNotification,
} from '@/features/notifications/notifications'

const DAY_MS = 86_400_000

function NotificationRow({ item }: { item: WildNotification }) {
  return (
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: notificationBg(item.icon) }]}>
        <Ionicons name={item.icon} size={18} color={colors.card} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        {item.body ? <Text style={styles.rowMessage}>{item.body}</Text> : null}
      </View>
      <Text style={styles.rowTime}>{formatTimeAgo(item.createdAt)}</Text>
    </View>
  )
}

function Section({ label, items }: { label: string; items: WildNotification[] }) {
  if (items.length === 0) return null
  return (
    <>
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.card}>
        {items.map((item, index) => (
          <View key={item.id}>
            <NotificationRow item={item} />
            {index < items.length - 1 ? <View style={styles.divider} /> : null}
          </View>
        ))}
      </View>
    </>
  )
}

export function NotificationsScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { notifications } = useNotifications()

  useEffect(() => {
    void markAllNotificationsRead()
  }, [])

  const cutoff = Date.now() - DAY_MS
  const recent = notifications.filter((n) => n.createdAt >= cutoff)
  const earlier = notifications.filter((n) => n.createdAt < cutoff)

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={() => router.back()} title="Notifications" />
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space[24] }]}
        showsVerticalScrollIndicator={false}>
        {notifications.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="notifications-off-outline" size={28} color={colors.dim} />
            <Text style={styles.emptyTitle}>No notifications yet</Text>
            <Text style={styles.emptySub}>Spot creatures, finish quests and level up to see updates here.</Text>
          </View>
        ) : (
          <>
            <Section label="NEW" items={recent} />
            <Section label="EARLIER" items={earlier} />
          </>
        )}
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
  empty: {
    marginTop: space[64],
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[24],
  },
  emptyTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  emptySub: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
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
