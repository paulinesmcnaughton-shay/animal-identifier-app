import { Ionicons } from '@expo/vector-icons'
import React from 'react'
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors } from '@/design/tokens'

type Tab = 'spot' | 'dex' | 'map' | 'me'

interface Props {
  activeTab: Tab
  onTabPress: (tab: Tab) => void
  onCapture: () => void
}

const TAB_HEIGHT = 60
const FAB_SIZE = 56

export default function BottomNav({ activeTab, onTabPress, onCapture }: Props) {
  const insets = useSafeAreaInsets()

  const tabs = [
    { key: 'spot' as Tab, label: 'Home', icon: 'home-outline', iconActive: 'home' },
    { key: 'dex' as Tab, label: 'Dex', icon: 'grid-outline', iconActive: 'grid' },
    { key: 'map' as Tab, label: 'Map', icon: 'map-outline', iconActive: 'map' },
    { key: 'me' as Tab, label: 'Profile', icon: 'person-outline', iconActive: 'person' },
  ]

  const renderTab = (tab: (typeof tabs)[0]) => {
    const active = activeTab === tab.key
    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tab}
        onPress={() => onTabPress(tab.key)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
        accessibilityLabel={tab.label}>
        <Ionicons
          name={(active ? tab.iconActive : tab.icon) as keyof typeof Ionicons.glyphMap}
          size={24}
          color={active ? colors.green : colors.dim}
        />
        <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.root}>
      <View
        style={[
          styles.container,
          {
            paddingBottom: insets.bottom,
            borderTopColor: colors.hairline,
          },
        ]}>
        <View style={styles.fabWrap} pointerEvents="box-none">
          <View style={styles.fabContainer}>
            <View style={styles.fabShadow} />
            <Pressable
              onPress={onCapture}
              accessibilityRole="button"
              accessibilityLabel="Capture"
              style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}>
              <Ionicons name="camera" size={26} color={colors.card} />
            </Pressable>
          </View>
        </View>

        <View style={styles.row}>
          {tabs.slice(0, 2).map(renderTab)}
          <View style={styles.fabGap} />
          {tabs.slice(2).map(renderTab)}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  container: {
    backgroundColor: 'transparent',
  },
  fabWrap: {
    position: 'absolute',
    top: -(FAB_SIZE / 2),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
  },
  fabContainer: {
    width: FAB_SIZE,
    height: FAB_SIZE + 5,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  fabShadow: {
    position: 'absolute',
    bottom: 0,
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.greenDark,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.green,
    borderWidth: 4,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fabPressed: {
    transform: [{ translateY: 4 }],
  },
  row: {
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabGap: {
    width: FAB_SIZE + 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.dim,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  labelActive: {
    color: colors.green,
  },
})
