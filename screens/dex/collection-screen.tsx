import { Ionicons } from '@expo/vector-icons'
import { Link, router } from 'expo-router'
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
import { DexCard, type DexCardSpecies } from '@/components/DexCard'
import {
  DEX_COLLECTION_SIZE,
  getDexCollectionByKingdom,
  getDexCollectionSorted,
} from '@/data/dex-collection'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const H_PAD = screenLayout.padH
const GAP = space[8]

const FILTERS: { key: string; label: string; kind: KingdomKey | null }[] = [
  { key: 'all', label: `All ${DEX_COLLECTION_SIZE}`, kind: null },
  { key: 'mammal', label: 'Mammals', kind: 'mammal' },
  { key: 'bird', label: 'Birds', kind: 'bird' },
  { key: 'insect', label: 'Insects', kind: 'insect' },
]

export function CollectionScreen() {
  const insets = useSafeAreaInsets()
  const [activeFilter, setActiveFilter] = useState('all')

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GAP * 2) / 3
  }, [])

  const rows = useMemo(() => {
    const filtered =
      activeFilter === 'all'
        ? MOCK_SPECIES
        : MOCK_SPECIES.filter((s) => s.kingdom === activeFilter)

    const result: DexCardSpecies[][] = []
    for (let i = 0; i < filtered.length; i += 3) {
      result.push(filtered.slice(i, i + 3))
    }
    return result
  }, [activeFilter])

  return (
    <View style={[styles.screen, { paddingTop: contentTopInset(insets.top) }]}>
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

        <CollectionStatsCard collected={DEX_COLLECTION_SIZE} total={DEX_COLLECTION_SIZE} streakDays={12} trophies={8} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScroll}
          style={styles.chipsWrap}>
          {FILTERS.map((f) => {
            const active = activeFilter === f.key
            const kingdom = f.kind ? KINGDOM[f.kind] : null
            const activeBg = kingdom ? kingdom.bg : colors.green
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
              {row.map((species) => (
                <DexCard
                  key={species.id}
                  species={species}
                  width={colWidth}
                  onPress={() =>
                    router.push({
                      pathname: '/species/[id]',
                      params: {
                        id: species.id,
                        name: species.name,
                        number: species.number,
                        kingdom: species.kingdom,
                      },
                    })
                  }
                />
              ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: screenLayout.iconBtnSize,
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
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
    borderRadius: screenLayout.iconBtnSize / 2,
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
    paddingVertical: space[8],
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
