import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import { useMemo, useState } from 'react'
import {
    Dimensions,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CollectionStatsCard } from '@/components/collection-stats-card'
import { DexCard, DexUnknownCard, type DexCardSpecies } from '@/components/DexCard'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const H_PAD = space[20]
const GAP = space[10]

const MOCK_SPECIES: DexCardSpecies[] = [
  { id: '1', number: '#012', name: 'Red Fox',  date: 'Today',     kingdom: 'mammal',    gradient: ['#FFB088', '#FF6B5B'], cornerBadge: 'NEW', showFootprint: true },
  { id: '2', number: '#089', name: 'Robin',    date: 'Yesterday', kingdom: 'bird',      gradient: ['#7FD8BE', '#15B981'] },
  { id: '3', number: '#201', name: 'Monarch',  date: '3d ago',    kingdom: 'insect',    gradient: ['#FFB347', '#FF8C42'], cornerBadge: 'RARE' },
  { id: '4', number: '#044', name: 'Badger',   date: '1w ago',    kingdom: 'mammal',    gradient: ['#A8D8EA', '#5BC0EB'] },
  { id: '5', number: '#156', name: 'Jay',      date: '2w ago',    kingdom: 'bird',      gradient: ['#C9B8FF', '#A855F7'] },
  { id: '6', number: '#078', name: 'Hare',     date: 'Today',     kingdom: 'mammal',    gradient: ['#FFD6A5', '#E8A87C'], showFootprint: true },
  { id: '7', number: '#033', name: 'Newt',     date: '4d ago',    kingdom: 'amphibian', gradient: ['#98E2C6', '#3DCCA8'] },
  { id: '8', number: '#112', name: 'Owl',      date: '1w ago',    kingdom: 'bird',      gradient: ['#D4C4F5', '#9B7ED9'], cornerBadge: 'NEW' },
]

const FILTERS: { key: string; label: string; kind: KingdomKey | null }[] = [
  { key: 'all',       label: 'All 47',  kind: null },
  { key: 'mammal',    label: 'Mammals', kind: 'mammal' },
  { key: 'bird',      label: 'Birds',   kind: 'bird' },
  { key: 'insect',    label: 'Insects', kind: 'insect' },
]

export function CollectionScreen() {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState('all')

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GAP * 2) / 3
  }, [])

  const rows = useMemo(() => {
    const filtered = activeFilter === 'all'
      ? MOCK_SPECIES
      : MOCK_SPECIES.filter((s) => s.kingdom === activeFilter)

    const items: ({ kind: 'species'; data: DexCardSpecies } | { kind: 'unknown' })[] =
      filtered.map((s) => ({ kind: 'species' as const, data: s }))

    const withUnknown = activeFilter === 'all'
      ? [...items.slice(0, 5), { kind: 'unknown' as const }, ...items.slice(5)]
      : items

    const result: ({ kind: 'species'; data: DexCardSpecies } | { kind: 'unknown' })[][] = []
    for (let i = 0; i < withUnknown.length; i += 3) {
      result.push(withUnknown.slice(i, i + 3))
    }
    return result
  }, [activeFilter])

  return (
    <View style={[styles.screen, { paddingTop: insets.top + space[8] }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.kicker}>YOUR COLLECTION</Text>
            <Text style={styles.title}>Wild Dex</Text>
          </View>
          <Link href="/dex/search" asChild>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Filter collection"
              style={({ pressed }) => [styles.filterBtn, pressed && styles.filterBtnPressed]}>
              <Ionicons name="funnel-outline" size={22} color={colors.ink2} />
            </Pressable>
          </Link>
        </View>

        <CollectionStatsCard collected={47} total={247} streakDays={12} trophies={8} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsWrap}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.key
            const kingdom = f.kind ? KINGDOM[f.kind] : null
            const activeBg = kingdom ? kingdom.bg : colors.ink
            return (
              <Pressable
                key={f.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setActiveFilter(f.key)}
                style={[
                  styles.chip,
                  active
                    ? [styles.chipActive, { backgroundColor: activeBg, borderColor: activeBg }]
                    : styles.chipIdle,
                ]}>
                <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
                  {kingdom ? `${kingdom.emoji} ` : ''}{f.label}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.grid}>
          {rows.map((row, ri) => (
            <View key={`row-${ri}`} style={styles.gridRow}>
              {row.map((cell) => {
                if (cell.kind === 'unknown') {
                  return <DexUnknownCard key="unknown" width={colWidth} />
                }
                return <DexCard key={cell.data.id} species={cell.data} width={colWidth} />
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: H_PAD,
    gap: space[16],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    gap: space[4],
  },
  kicker: {
    fontSize: typeTokens.size.micro,
    fontWeight: '700',
    color: colors.dim,
    letterSpacing: 1.2,
  },
  title: {
    fontSize: typeTokens.size.displayMD,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  filterBtnPressed: {
    opacity: 0.92,
  },
  chipsWrap: {
    marginHorizontal: -H_PAD,
  },
  chipsScroll: {
    paddingHorizontal: H_PAD,
    gap: space[8],
    paddingVertical: space[4],
  },
  chip: {
    paddingHorizontal: space[16],
    paddingVertical: space[10],
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  chipIdle: {
    backgroundColor: colors.card,
    borderColor: colors.hairline,
  },
  chipLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: colors.card,
  },
  chipLabelIdle: {
    color: colors.ink,
  },
  grid: {
    gap: GAP,
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: GAP,
  },
})
