import { Ionicons } from '@expo/vector-icons'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { mockHomeNotifications, type HomeNotification } from '@/data/mock'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

const POPOVER_WIDTH = 300
const HEADER_OFFSET = space[56]

interface HomeNotificationsPopoverProps {
  visible: boolean
  onClose: () => void
  onViewAll: () => void
}

function NotificationRow({ item, isLast }: { item: HomeNotification; isLast: boolean }) {
  return (
    <View style={[styles.row, !isLast && styles.rowBorder]}>
      <View style={[styles.iconWrap, { backgroundColor: item.iconBg }]}>
        <Ionicons name={item.icon} size={18} color={colors.card} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.rowMessage} numberOfLines={2}>
          {item.message}
        </Text>
      </View>
      <Text style={styles.rowTime}>{item.timeAgo}</Text>
    </View>
  )
}

export function HomeNotificationsPopover({
  visible,
  onClose,
  onViewAll,
}: HomeNotificationsPopoverProps) {
  const insets = useSafeAreaInsets()
  const newCount = mockHomeNotifications.length

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close notifications">
        <Pressable
          style={[
            styles.popover,
            {
              top: insets.top + HEADER_OFFSET,
              right: screenLayout.padH,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View style={styles.popoverHeader}>
            <Text style={styles.popoverTitle}>Notifications</Text>
            <Text style={styles.popoverSub}>{newCount} new</Text>
          </View>

          <View style={styles.list}>
            {mockHomeNotifications.map((item, index) => (
              <NotificationRow
                key={item.id}
                item={item}
                isLast={index === mockHomeNotifications.length - 1}
              />
            ))}
          </View>

          <Pressable
            onPress={onViewAll}
            accessibilityRole="button"
            accessibilityLabel="View all notifications"
            style={({ pressed }) => [styles.viewAllBtn, pressed && styles.viewAllPressed]}>
            <Text style={styles.viewAllText}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.green} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 33, 48, 0.25)',
  },
  popover: {
    position: 'absolute',
    width: POPOVER_WIDTH,
    maxWidth: '92%',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    ...shadow.card,
    overflow: 'hidden',
  },
  popoverHeader: {
    paddingHorizontal: space[16],
    paddingTop: space[16],
    paddingBottom: space[8],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  popoverTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  popoverSub: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  list: {
    paddingVertical: space[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    paddingHorizontal: space[16],
    paddingVertical: space[16],
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
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
    letterSpacing: 0.3,
    flexShrink: 0,
    marginTop: space[4],
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
    paddingVertical: space[16],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  viewAllPressed: {
    opacity: 0.7,
  },
  viewAllText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
})
