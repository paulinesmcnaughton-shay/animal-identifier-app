import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';

type Tab = 'spot' | 'dex' | 'map' | 'me';

interface Props {
  activeTab: Tab;
  onTabPress: (tab: Tab) => void;
  onCapture: () => void;
}

const TAB_HEIGHT = 60;
const FAB_SIZE = 56;

export default function BottomNav({ activeTab, onTabPress, onCapture }: Props) {
  const insets = useSafeAreaInsets();

  const tabs = [
    { key: 'spot' as Tab, label: 'Spot', icon: 'home-outline', iconActive: 'home' },
    { key: 'dex'  as Tab, label: 'Dex',  icon: 'grid-outline', iconActive: 'grid' },
    { key: 'map'  as Tab, label: 'Map',  icon: 'map-outline',  iconActive: 'map'  },
    { key: 'me'   as Tab, label: 'Me',   icon: 'person-outline', iconActive: 'person' },
  ];

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
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* FAB floats above, centered */}
      <View style={styles.fabWrap} pointerEvents="box-none">
        <TouchableOpacity style={styles.fab} onPress={onCapture} activeOpacity={0.85}>
          <Ionicons name="camera" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tab row */}
      <View style={styles.row}>
        {tabs.slice(0, 2).map(renderTab)}
        <View style={styles.fabGap} />
        {tabs.slice(2).map(renderTab)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.ink,
  },
  fabWrap: {
    position: 'absolute',
    top: -(FAB_SIZE * 0.6),
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 20,
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
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
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
    color: '#8BA5BC',
  },
  labelActive: {
    color: colors.green,
  },
});