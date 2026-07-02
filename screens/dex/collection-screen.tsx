import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { CollectionStatsCard } from '@/components/collection-stats-card'
import { DexCollectionEmpty } from '@/components/dex/DexCollectionEmpty'
import { DexCard, type DexCardSpecies } from '@/components/DexCard'
import { useCatalogCount } from '@/features/dex/use-catalog-count'
import { KINGDOM, KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { deleteUserSighting } from '@/features/sightings/delete-user-sighting'
import { useAccountProfile } from '@/features/settings/account-profile'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'
import { speciesDetailRouteParamsFromId } from '@/features/species/species-latin-names'
import {
  PICKER_KINGDOM_TABS,
  type PickerKingdomFilter,
} from '@/features/species/picker-kingdom-tabs'
import {
  CATALOG_PAGE_SIZE,
  pickerItemToLookupId,
  searchPickerSpecies,
  type PickerSpeciesItem,
} from '@/features/species/search-picker-species'
import { useReferenceImage } from '@/features/species/use-reference-image'
import {
  COLLECTIONS,
  fetchSpeciesByCollection,
  type CatalogSpecies,
  type Collection,
} from '@/features/collections/collections'
import { useAuth } from '@/lib/auth/auth-context'

// Collections shown as browse chips in the Open Source tab (excludes wild/domestic).
const BROWSE_COLLECTIONS = COLLECTIONS.filter((c) =>
  ['farm', 'petting_zoo', 'safari', 'zoo', 'aquarium'].includes(c.id),
)

function catalogToPickerItem(c: CatalogSpecies): PickerSpeciesItem {
  const kingdom = (c.kingdom && c.kingdom in KINGDOM ? c.kingdom : 'fish') as KingdomKey
  return {
    id: c.id,
    commonName: c.commonName,
    latinName: c.scientificName ?? '',
    kingdom,
    taxonomyKingdom: c.kingdom,
    imageUrl: c.referenceImageUrl,
    isDomestic: false,
    dexNumber: c.dexNumber ?? undefined,
    gradient: ['#A8D8EA', '#5BC0EB'],
  }
}

const H_PAD = screenLayout.padH
const GAP = space[8]
const SEARCH_DEBOUNCE_MS = 400

const FILTERS: { key: string; label: string; kind: KingdomKey | null }[] = [
  { key: 'all', label: 'All', kind: null },
  { key: 'mammal', label: 'Mammals', kind: 'mammal' },
  { key: 'bird', label: 'Birds', kind: 'bird' },
  { key: 'insect', label: 'Insects', kind: 'insect' },
]

type DexTab = 'collection' | 'open-source'

export function CollectionScreen() {
  const insets = useSafeAreaInsets()
  const [dexTab, setDexTab] = useState<DexTab>('collection')
  const [activeFilter, setActiveFilter] = useState('all')
  const { isAuthenticated } = useAuth()
  const { spotsCaptured, streakDays, badgesCount, isLoading, isReady } = useAccountProfile()
  const { dexEntries, isLoading: dexDataLoading } = useUserSightingsData()
  const catalogCount = useCatalogCount()

  const [isDeleteMode, setIsDeleteMode] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<DexCardSpecies | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [pendingDeleteHasJournalData, setPendingDeleteHasJournalData] = useState(false)

  useEffect(() => {
    if (!pendingDelete) { setPendingDeleteHasJournalData(false); return }
    const supabase = getSupabaseClient()
    if (!supabase) return
    let cancelled = false
    void (async () => {
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId || cancelled) return
      const { data } = await supabase
        .from('user_sightings')
        .select('notes, journal_entry, user_caption')
        .eq('user_id', userId)
        .eq('species_id', pendingDelete.id)
        .eq('is_deleted', false)
        .limit(20)
      if (!cancelled) {
        const hasData = (data ?? []).some(
          (r) => r.notes || r.journal_entry || r.user_caption,
        )
        setPendingDeleteHasJournalData(hasData)
      }
    })()
    return () => { cancelled = true }
  }, [pendingDelete])

  const colWidth = useMemo(() => {
    const w = Dimensions.get('window').width
    return (w - H_PAD * 2 - GAP * 2) / 3
  }, [])

  const rows = useMemo(() => {
    if (spotsCaptured === 0) return []
    const filtered =
      activeFilter === 'all'
        ? dexEntries
        : dexEntries.filter((entry) => entry.kingdom === activeFilter)
    const result: DexCardSpecies[][] = []
    for (let i = 0; i < filtered.length; i += 3) {
      result.push(filtered.slice(i, i + 3))
    }
    return result
  }, [activeFilter, dexEntries, spotsCaptured])

  // Set of lowercase species names the user has already collected — used for "Collected" badges.
  const collectedNames = useMemo(
    () => new Set(dexEntries.map((e) => e.name.toLowerCase())),
    [dexEntries],
  )

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return
    setIsDeleting(true)
    await deleteUserSighting(pendingDelete.id)
    setIsDeleting(false)
    setPendingDelete(null)
    setPendingDeleteHasJournalData(false)
  }

  const isCollectionLoading =
    isLoading || !isReady || (isAuthenticated && dexDataLoading && spotsCaptured > 0)

  return (
    <View style={[styles.screen, { paddingTop: contentTopInset(insets.top) }]}>
      {/* ── Fixed top bar ── */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Wild Dex</Text>
        {dexTab === 'collection' ? (
          isDeleteMode ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exit edit mode"
              onPress={() => setIsDeleteMode(false)}
              style={({ pressed }) => [styles.doneBtn, pressed && styles.doneBtnPressed]}>
              <Text style={styles.doneBtnLabel}>Done</Text>
            </Pressable>
          ) : (
            <Link href="/dex/search" asChild>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Filter collection"
                style={({ pressed }) => [styles.filterBtn, pressed && styles.filterBtnPressed]}>
                <Ionicons name="funnel-outline" size={22} color={colors.ink2} />
              </Pressable>
            </Link>
          )
        ) : null}
      </View>

      {/* ── Segmented tab control ── */}
      <View style={styles.segRow}>
        <View style={styles.segControl}>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: dexTab === 'collection' }}
            onPress={() => setDexTab('collection')}
            style={[styles.segPill, dexTab === 'collection' && styles.segPillActive]}>
            <Text style={[styles.segLabel, dexTab === 'collection' && styles.segLabelActive]}>
              Your Collection
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="tab"
            accessibilityState={{ selected: dexTab === 'open-source' }}
            onPress={() => setDexTab('open-source')}
            style={[styles.segPill, dexTab === 'open-source' && styles.segPillActive]}>
            <Text style={[styles.segLabel, dexTab === 'open-source' && styles.segLabelActive]}>
              Open Source
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Tab content ── */}
      {dexTab === 'collection' ? (
        isCollectionLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.green} />
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 100 }]}>
            <CollectionStatsCard
              collected={spotsCaptured}
              total={catalogCount ?? spotsCaptured}
              streakDays={streakDays}
              trophies={badgesCount}
            />

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
                      {kingdom ? `${kingdom.emoji} ` : ''}
                      {f.key === 'all' ? `All ${dexEntries.length}` : f.label}
                    </Text>
                  </Pressable>
                )
              })}
            </ScrollView>

            {spotsCaptured === 0 ? (
              <DexCollectionEmpty />
            ) : (
              <View style={styles.grid}>
                {rows.map((row, ri) => (
                  <View key={`row-${ri}`} style={styles.gridRow}>
                    {row.map((species) => (
                      <DexCard
                        key={species.id}
                        species={species}
                        width={colWidth}
                        isDeleteMode={isDeleteMode}
                        onLongPress={() => setIsDeleteMode(true)}
                        onDeletePress={() => setPendingDelete(species)}
                        onPress={() =>
                          router.push({
                            pathname: '/species/[id]',
                            params: speciesDetailRouteParamsFromId({
                              id: species.id,
                              name: species.name,
                              number: species.number,
                              kingdom: species.kingdom,
                            }) as { id: string } & Record<string, string>,
                          })
                        }
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )
      ) : (
        <OpenSourceTab
          collectedNames={collectedNames}
          bottomInset={insets.bottom}
        />
      )}

      <DeleteConfirmModal
        species={pendingDelete}
        isDeleting={isDeleting}
        hasJournalData={pendingDeleteHasJournalData}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  )
}

// ─── Open Source tab ──────────────────────────────────────────────────────────

interface OpenSourceTabProps {
  collectedNames: Set<string>
  bottomInset: number
}

const OS_CARD_GAP = space[8]

function OpenSourceTab({ collectedNames, bottomInset }: OpenSourceTabProps) {
  const { width } = useMemo(() => Dimensions.get('window'), [])
  const cardWidth = (width - H_PAD * 2 - OS_CARD_GAP) / 2

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [kingdomFilter, setKingdomFilter] = useState<PickerKingdomFilter>('all')
  const [collectionFilter, setCollectionFilter] = useState<Collection | null>(null)
  const [items, setItems] = useState<PickerSpeciesItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const searchInputRef = useRef<TextInput>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    // A collection chip (Safari/Zoo/Aquarium/…) browses the full occurrence
    // catalog tagged by taxonomy — comprehensive, not just a handful of
    // hand-picked animals. Both paths page the same way.
    const load = collectionFilter
      ? fetchSpeciesByCollection(collectionFilter, 0).then((rows) => rows.map(catalogToPickerItem))
      : searchPickerSpecies(debouncedQuery, kingdomFilter, 0)

    void load
      .then((results) => {
        if (cancelled) return
        setItems(results)
        setHasMore(results.length >= CATALOG_PAGE_SIZE)
      })
      .catch(() => {
        if (!cancelled) {
          setItems([])
          setHasMore(false)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => { cancelled = true }
  }, [debouncedQuery, kingdomFilter, collectionFilter])

  // Scrolling near the end of the browse/search results loads the next page —
  // this is what lets "Open Source" surface the whole 36k+ catalog instead of
  // being capped at one page.
  const handleLoadMore = useCallback(() => {
    if (isLoading || isLoadingMore || !hasMore) return
    setIsLoadingMore(true)
    const more = collectionFilter
      ? fetchSpeciesByCollection(collectionFilter, items.length).then((rows) => rows.map(catalogToPickerItem))
      : searchPickerSpecies(debouncedQuery, kingdomFilter, items.length)
    more
      .then((page) => {
        setItems((prev) => {
          const seen = new Set(prev.map((p) => p.id))
          return [...prev, ...page.filter((m) => !seen.has(m.id))]
        })
        setHasMore(page.length >= CATALOG_PAGE_SIZE)
      })
      .catch(() => setHasMore(false))
      .finally(() => setIsLoadingMore(false))
  }, [isLoading, isLoadingMore, hasMore, collectionFilter, debouncedQuery, kingdomFilter, items.length])

  const handleSelectItem = useCallback((item: PickerSpeciesItem) => {
    const speciesId = pickerItemToLookupId(item)
    router.push({
      pathname: '/species/[id]',
      params: {
        id: speciesId,
        name: item.commonName,
        kingdom: item.kingdom,
        ...(item.latinName ? { latin: item.latinName } : {}),
        ...(item.dexNumber ? { number: item.dexNumber } : {}),
        ...(item.isDomestic ? { domestic: '1' } : {}),
      },
    })
  }, [])

  const renderItem = useCallback(
    ({ item, index }: { item: PickerSpeciesItem; index: number }) => {
      const isLeft = index % 2 === 0
      return (
        <OpenSourceCard
          item={item}
          width={cardWidth}
          isCollected={collectedNames.has(item.commonName.toLowerCase())}
          style={isLeft ? { marginRight: OS_CARD_GAP / 2 } : { marginLeft: OS_CARD_GAP / 2 }}
          onPress={() => handleSelectItem(item)}
        />
      )
    },
    [cardWidth, collectedNames, handleSelectItem],
  )

  return (
    <View style={styles.osRoot}>
      {/* Search bar */}
      <View style={styles.osSearchRow}>
        <View style={styles.osSearchWrap}>
          <Ionicons name="search" size={18} color={colors.dim} />
          <TextInput
            ref={searchInputRef}
            value={query}
            onChangeText={setQuery}
            placeholder="Search animals, plants, fungi…"
            placeholderTextColor={colors.dim}
            style={styles.osSearchInput}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {query.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setQuery('')}
              hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.dim} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Filter chips — kingdoms + collections in one scrolling row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.osChipsScroll}
        style={styles.osChipsWrap}>
        {PICKER_KINGDOM_TABS.map((tab) => {
          const active = !collectionFilter && kingdomFilter === tab.id
          return (
            <Pressable
              key={tab.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setCollectionFilter(null)
                setKingdomFilter(tab.id)
              }}
              style={[
                styles.chip,
                active
                  ? [styles.chipActive, { backgroundColor: tab.color, borderColor: tab.color }]
                  : styles.chipIdle,
              ]}>
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
                {tab.emoji} {tab.label}
              </Text>
            </Pressable>
          )
        })}
        {BROWSE_COLLECTIONS.map((c) => {
          const active = collectionFilter === c.id
          return (
            <Pressable
              key={c.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setCollectionFilter(active ? null : c.id)}
              style={[
                styles.chip,
                active
                  ? [styles.chipActive, { backgroundColor: c.accent, borderColor: c.accent }]
                  : styles.chipIdle,
              ]}>
              <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelIdle]}>
                {c.emoji} {c.label}
              </Text>
            </Pressable>
          )
        })}
      </ScrollView>

      {/* Result grid */}
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        style={styles.osGrid}
        contentContainerStyle={[
          styles.osGridContent,
          { paddingBottom: bottomInset + space[56] + space[24] },
        ]}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.osFooterWrap}>
              <ActivityIndicator color={colors.green} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.osEmptyWrap}>
              <ActivityIndicator color={colors.green} />
            </View>
          ) : (
            <View style={styles.osEmptyWrap}>
              <Text style={styles.osEmptyText}>
                {debouncedQuery.length > 0
                  ? `No results for "${debouncedQuery}"`
                  : 'Search animals, plants, fungi, and more'}
              </Text>
            </View>
          )
        }
        renderItem={renderItem}
      />
    </View>
  )
}

// ─── Open Source result card ──────────────────────────────────────────────────

interface OpenSourceCardProps {
  item: PickerSpeciesItem
  width: number
  isCollected: boolean
  style?: object
  onPress: () => void
}

function OpenSourceCard({ item, width, isCollected, style, onPress }: OpenSourceCardProps) {
  const { uri: imageUrl, onImageError } = useReferenceImage(
    {
      commonName: item.commonName,
      scientificName: item.latinName,
      speciesId: item.id,
      dexNum: item.dexNumber ?? null,
      kingdom: item.kingdom,
      isDomestic: item.isDomestic,
      appRegistryImageUrl: item.imageUrl,
    },
    { screen: 'dex', component: 'OpenSourceCard' },
  )

  const kingdomMeta = KINGDOM[item.kingdom]

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${item.commonName}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.osCard,
        { width },
        style,
        pressed && styles.osCardPressed,
      ]}>
      <View style={[styles.osCardArt, { backgroundColor: kingdomMeta?.bg ?? colors.hairline }]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onError={() => onImageError(imageUrl)}
          />
        ) : (
          <LinearGradient
            colors={[...item.gradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
        )}
        {isCollected ? (
          <View style={styles.collectedBadge}>
            <Ionicons name="checkmark" size={10} color={colors.card} />
            <Text style={styles.collectedBadgeText}>Collected</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.osCardBody}>
        <Text style={styles.osCardName} numberOfLines={2}>
          {item.commonName}
        </Text>
        <KingdomBadge kind={item.kingdom} />
      </View>
    </Pressable>
  )
}

// ─── Delete confirmation modal ────────────────────────────────────────────────

interface DeleteConfirmModalProps {
  species: DexCardSpecies | null
  isDeleting: boolean
  hasJournalData: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmModal({ species, isDeleting, hasJournalData, onConfirm, onCancel }: DeleteConfirmModalProps) {
  return (
    <Modal
      visible={species !== null}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.dialog} onPress={() => {}}>
          <View style={styles.dialogIconWrap}>
            <Ionicons name="trash-outline" size={28} color={colors.coral} />
          </View>
          <Text style={styles.dialogTitle}>Remove from Wild Dex?</Text>
          <Text style={styles.dialogBody}>
            <Text style={styles.dialogSpeciesName}>{species?.name}</Text>
            {' '}will be permanently removed from your collection. All sightings of this species will be deleted.
          </Text>
          {hasJournalData ? (
            <View style={styles.journalWarning}>
              <Ionicons name="journal-outline" size={16} color={colors.earth} />
              <Text style={styles.journalWarningText}>
                This sighting has saved notes or journal entries. You may want to export your journal before deleting.
              </Text>
            </View>
          ) : null}
          <View style={styles.dialogActions}>
            <Pressable
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [styles.actionBtn, styles.cancelBtn, pressed && styles.actionBtnPressed]}>
              <Text style={styles.cancelBtnLabel}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={isDeleting}
              style={({ pressed }) => [styles.actionBtn, styles.deleteConfirmBtn, pressed && styles.actionBtnPressed]}>
              {isDeleting ? (
                <ActivityIndicator size="small" color={colors.card} />
              ) : (
                <Text style={styles.deleteConfirmBtnLabel}>
                  {hasJournalData ? 'Delete Anyway' : 'Delete'}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Top bar ──
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: H_PAD,
    paddingBottom: space[8],
    minHeight: screenLayout.iconBtnSize,
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
  doneBtn: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  doneBtnPressed: {
    opacity: 0.8,
  },
  doneBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.card,
  },

  // ── Segmented control ──
  segRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: space[16],
  },
  segControl: {
    flexDirection: 'row',
    backgroundColor: colors.hairline,
    borderRadius: radius.md,
    padding: 3,
  },
  segPill: {
    flex: 1,
    paddingVertical: space[8],
    borderRadius: radius.md - 2,
    alignItems: 'center',
  },
  segPillActive: {
    backgroundColor: colors.card,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  segLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '600',
    color: colors.dim,
  },
  segLabelActive: {
    color: colors.ink,
  },

  // ── Your Collection scroll ──
  scroll: {
    paddingHorizontal: H_PAD,
    gap: space[16],
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
    paddingTop: space[8],
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: GAP,
  },

  // ── Open Source tab ──
  osRoot: {
    flex: 1,
  },
  osSearchRow: {
    paddingHorizontal: H_PAD,
    paddingBottom: space[8],
  },
  osSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  osSearchInput: {
    flex: 1,
    fontSize: typeTokens.size.body,
    color: colors.ink,
    padding: 0,
  },
  osChipsWrap: {
    // No negative margin here: osRoot has no horizontal padding, so the row is
    // already full-width. osChipsScroll's H_PAD padding aligns the first chip with
    // the search bar / grid / the Your Collection chips (was flush to the edge).
    marginBottom: space[8],
    // Fixed height stops the horizontal ScrollView from stretching to fill the
    // flex:1 column (which turned the chips into full-height bars). 48 is on the
    // 8pt grid; no spacing token exists at this value.
    height: 48,
    flexGrow: 0,
    flexShrink: 0,
  },
  osChipsScroll: {
    paddingHorizontal: H_PAD,
    gap: space[8],
    // Center chips vertically within the fixed-height row so they keep their pill shape.
    alignItems: 'center',
  },
  osGrid: {
    flex: 1,
  },
  osGridContent: {
    paddingHorizontal: H_PAD,
    paddingTop: space[8],
    gap: OS_CARD_GAP,
  },
  osEmptyWrap: {
    paddingTop: space[48],
    alignItems: 'center',
    paddingHorizontal: H_PAD,
  },
  osFooterWrap: {
    paddingVertical: space[24],
    alignItems: 'center',
  },
  osEmptyText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 22,
  },

  // ── Open Source card ──
  osCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: OS_CARD_GAP,
  },
  osCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  osCardArt: {
    height: 110,
    overflow: 'hidden',
  },
  collectedBadge: {
    position: 'absolute',
    top: space[8],
    right: space[8],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.green,
    paddingHorizontal: space[8],
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  collectedBadgeText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.card,
    letterSpacing: 0.3,
  },
  osCardBody: {
    padding: space[8],
    gap: space[8],
  },
  osCardName: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.ink,
    minHeight: 36,
  },

  // ── Delete modal ──
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[32],
  },
  dialog: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space[24],
    alignItems: 'center',
    gap: space[16],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 32,
    elevation: 16,
  },
  dialogIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${colors.coral}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
  },
  dialogBody: {
    fontSize: typeTokens.size.bodySM,
    color: colors.ink2,
    textAlign: 'center',
    lineHeight: 20,
  },
  dialogSpeciesName: {
    fontWeight: '700',
    color: colors.ink,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: space[8],
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    paddingVertical: space[16],
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnPressed: {
    opacity: 0.75,
  },
  cancelBtn: {
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  cancelBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.ink,
  },
  deleteConfirmBtn: {
    backgroundColor: colors.coral,
  },
  deleteConfirmBtnLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.card,
  },
  journalWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    marginTop: space[8],
  },
  journalWarningText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.earth,
    lineHeight: 18,
  },
})
