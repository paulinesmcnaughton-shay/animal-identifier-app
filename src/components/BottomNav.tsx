import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

type Tab = 'spot' | 'dex' | 'map' | 'me';

interface Props {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  onCapture: () => void;
}

const TAB_HEIGHT = 60;
const FAB_SIZE = 56;
/** Height above tab row needed so FAB’s top half sits outside the bar */
const FAB_OVERFLOW = FAB_SIZE / 2;

export default function BottomNav({ activeTab, onTabPress, onCapture }: Props) {
  const insets = useSafeAreaInsets();

  const tabs: { key: Tab; label: string; icon: string; iconActive: string }[] = [
    { key: 'spot', label: 'Spot',  icon: 'home-outline',    iconActive: 'home' },
    { key: 'dex',  label: 'Dex',   icon: 'grid-outline',    iconActive: 'grid' },
    { key: 'map',  label: 'Map',   icon: 'map-outline',     iconActive: 'map' },
    { key: 'me',   label: 'Me',    icon: 'person-outline',  iconActive: 'person' },
  ];

  // Split tabs around the FAB slot in the center
  const leftTabs  = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  const renderTab = (tab: typeof tabs[0]) => {
    const active = activeTab === tab.key;
    return (
      <TouchableOpacity
        key={tab.key}
        style={styles.tab}
        onPress={() => onTabPress(tab.key)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={(active ? tab.iconActive : tab.icon) as any}
          size={24}
          color={active ? colors.green : '#8BA5BC'}
        />
        <Text style={[styles.label, active && styles.labelActive]}>
          {tab.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.inner}>
        <View style={styles.bar}>
          <View style={styles.side}>{leftTabs.map(renderTab)}</View>
          <View style={styles.fabSlot} />
          <View style={styles.side}>{rightTabs.map(renderTab)}</View>
        </View>

        <View style={styles.fabContainer} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.fab}
            onPress={onCapture}
            activeOpacity={0.85}
          >
            <Ionicons name="camera" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
  },
  inner: {
    position: 'relative',
    height: TAB_HEIGHT + FAB_OVERFLOW,
  },
  fabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: TAB_HEIGHT - FAB_SIZE / 2,
    alignItems: 'center',
    zIndex: 10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 8,
  },
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
  },
  side: {
    flex: 1,
    flexDirection: 'row',
  },
  fabSlot: {
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
    fontFamily: 'Nunito',
    fontWeight: '600',
    color: '#8BA5BC',
    letterSpacing: 0.2,
  },
  labelActive: {
    color: colors.green,
  },
});
