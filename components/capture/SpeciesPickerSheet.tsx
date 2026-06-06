import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { SHEET_ENTER_TIMING, SHEET_EXIT_TIMING } from '@/lib/draggable-sheet'

const PER_PAGE = 20

const ICONIC: Partial<Record<KingdomKey, string>> = {
  mammal:    'Mammalia',
  bird:      'Aves',
  reptile:   'Reptilia',
  amphibian: 'Amphibia',
  fish:      'Actinopterygii',
  insect:    'Insecta',
  arachnid:  'Arachnida',
  mollusc:   'Mollusca',
  plant:     'Plantae',
  tree:      'Plantae',
  flower:    'Plantae',
  fungi:     'Fungi',
}

const INAT_KINGDOM_MAP: Record<string, KingdomKey> = {
  Mammalia:       'mammal',
  Aves:           'bird',
  Reptilia:       'reptile',
  Amphibia:       'amphibian',
  Actinopterygii: 'fish',
  Insecta:        'insect',
  Arachnida:      'arachnid',
  Mollusca:       'mollusc',
  Plantae:        'plant',
  Fungi:          'fungi',
}

interface InatTaxon {
  id: number
  name?: string
  preferred_common_name?: string
  default_photo?: { medium_url?: string; square_url?: string }
  iconic_taxon_name?: string
}

export interface PickerSelection {
  commonName: string
  latinName: string
  kingdom: KingdomKey
  imageUrl: string | null
  isUserCorrected: true
}

interface PickerRow {
  id: string
  commonName: string
  latinName: string
  kingdom: KingdomKey
  imageUrl: string | null
}

function mapTaxon(taxon: InatTaxon, fallbackKingdom: KingdomKey | null): PickerRow {
  const iconic = taxon.iconic_taxon_name ?? ''
  const kingdom = INAT_KINGDOM_MAP[iconic] ?? fallbackKingdom ?? 'mammal'
  const commonName = taxon.preferred_common_name?.trim() || taxon.name?.trim() || 'Unknown'
  return {
    id: `inat-${taxon.id}`,
    commonName,
    latinName: taxon.name ?? '',
    kingdom,
    imageUrl: taxon.default_photo?.medium_url ?? taxon.default_photo?.square_url ?? null,
  }
}

async function fetchSpeciesPage(
  query: string,
  kingdom: KingdomKey | null,
  page: number,
): Promise<{ rows: PickerRow[]; total: number }> {
  const iconic = kingdom ? ICONIC[kingdom] : null
  const trimmed = query.trim()

  let url: string
  if (trimmed.length >= 2) {
    url = `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(trimmed)}&per_page=${PER_PAGE}&page=${page}&rank=species,subspecies,variety`
  } else {
    url = `https://api.inaturalist.org/v1/taxa?per_page=${PER_PAGE}&page=${page}&rank=species&order_by=observations_count&order=desc`
  }
  if (iconic) url += `&iconic_taxa=${iconic}`

  try {
    const res = await fetch(url)
    if (!res.ok) return { rows: [], total: 0 }
    const data = (await res.json()) as { results?: InatTaxon[]; total_results?: number }
    return {
      rows: (data.results ?? []).map((t) => mapTaxon(t, kingdom)),
      total: data.total_results ?? 0,
    }
  } catch {
    return { rows: [], total: 0 }
  }
}

interface SpeciesPickerSheetProps {
  visible: boolean
  hintCommonName?: string
  hintKingdom?: KingdomKey | null
  onClose: () => void
  onSelect: (selection: PickerSelection) => void
}

export function SpeciesPickerSheet({
  visible,
  hintCommonName,
  hintKingdom,
  onClose,
  onSelect,
}: SpeciesPickerSheetProps) {
  const { height: windowHeight } = useWindowDimensions()
  const insets = useSafeAreaInsets()

  const translateY = useSharedValue(windowHeight)
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.value / windowHeight) * 0.65,
  }))
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, SHEET_ENTER_TIMING)
    } else {
      translateY.value = withTiming(windowHeight, SHEET_EXIT_TIMING)
    }
  }, [visible, translateY, windowHeight])

  const [query, setQuery] = useState(hintCommonName ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(hintCommonName ?? '')
  const [rows, setRows] = useState<PickerRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const fetchingMoreRef = useRef(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  // Reset and load page 1 whenever query or kingdom changes
  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setIsLoading(true)
    setRows([])
    setPage(1)
    fetchingMoreRef.current = false

    fetchSpeciesPage(debouncedQuery, hintKingdom ?? null, 1).then(({ rows: r, total: t }) => {
      if (cancelled) return
      setRows(r)
      setTotal(t)
      setIsLoading(false)
    }).catch(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => { cancelled = true }
  }, [debouncedQuery, hintKingdom, visible])

  const handleEndReached = useCallback(() => {
    if (fetchingMoreRef.current || isLoading) return
    const nextPage = page + 1
    if (rows.length >= total && total > 0) return

    fetchingMoreRef.current = true
    setIsFetchingMore(true)

    fetchSpeciesPage(debouncedQuery, hintKingdom ?? null, nextPage).then(({ rows: more }) => {
      setRows((prev) => [...prev, ...more])
      setPage(nextPage)
      setIsFetchingMore(false)
      fetchingMoreRef.current = false
    }).catch(() => {
      setIsFetchingMore(false)
      fetchingMoreRef.current = false
    })
  }, [debouncedQuery, hintKingdom, isLoading, page, rows.length, total])

  const handleSelect = useCallback((row: PickerRow) => {
    onSelect({
      commonName: row.commonName,
      latinName: row.latinName,
      kingdom: row.kingdom,
      imageUrl: row.imageUrl,
      isUserCorrected: true,
    })
  }, [onSelect])

  if (!visible) return null

  return (
    <>
      <ReAnimated.View
        style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />
      <ReAnimated.View
        style={[
          styles.sheet,
          { paddingBottom: insets.bottom },
          sheetStyle,
        ]}>
        <View style={[styles.header, { paddingTop: space[24] }]}>
          <View style={styles.headerSpacer} />
          <Text style={styles.headerTitle}>Choose a species</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.dim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search species…"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>

        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SpeciesRow item={item} onPress={() => handleSelect(item)} />
          )}
          contentContainerStyle={styles.listContent}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.4}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyWrap}>
                <ActivityIndicator color={colors.green} />
              </View>
            ) : (
              <Text style={styles.emptyText}>No species found. Try another search.</Text>
            )
          }
          ListFooterComponent={
            isFetchingMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator color={colors.dim} size="small" />
              </View>
            ) : null
          }
        />
      </ReAnimated.View>
    </>
  )
}

interface SpeciesRowProps {
  item: PickerRow
  onPress: () => void
}

function SpeciesRow({ item, onPress }: SpeciesRowProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.commonName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {item.imageUrl ? (
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.rowImage}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={styles.rowImagePlaceholder}>
          <Text style={styles.rowImageInitial}>
            {item.commonName[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
      )}
      <View style={styles.rowBody}>
        <Text style={styles.rowCommon} numberOfLines={1}>{item.commonName}</Text>
        <Text style={styles.rowLatin} numberOfLines={1}>{item.latinName}</Text>
      </View>
      <KingdomBadge kind={item.kingdom} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#000',
    zIndex: 30,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: colors.bg,
    zIndex: 31,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingBottom: space[16],
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    opacity: 0.6,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginHorizontal: space[16],
    marginBottom: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  searchInput: {
    flex: 1,
    fontSize: typeTokens.size.body,
    color: colors.ink,
    padding: 0,
  },
  listContent: {
    paddingHorizontal: space[16],
    paddingTop: space[8],
    paddingBottom: space[32],
  },
  emptyWrap: {
    paddingTop: space[48],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
    paddingTop: space[48],
  },
  footerLoader: {
    paddingVertical: space[16],
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[8],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowPressed: {
    opacity: 0.75,
  },
  rowImage: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
  },
  rowImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowImageInitial: {
    fontSize: typeTokens.size.displaySM,
    fontFamily: typeTokens.display.family,
    fontWeight: typeTokens.display.weight,
    color: colors.dim,
  },
  rowBody: {
    flex: 1,
    gap: space[4],
  },
  rowCommon: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  rowLatin: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    fontStyle: 'italic',
  },
})
