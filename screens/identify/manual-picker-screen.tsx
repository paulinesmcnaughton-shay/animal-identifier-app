import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { dexCardHairline } from '@/design/dex-card-shell'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { saveUnidentifiedSighting } from '@/features/capture/save-unidentified-sighting'
import {
  parsePipelineCategory,
  pipelineCategoryToPickerFilter,
} from '@/features/identify/manual-picker-params'
import {
  PICKER_KINGDOM_TABS,
  type PickerKingdomFilter,
} from '@/features/species/picker-kingdom-tabs'
import {
  pickerItemToLookupId,
  searchPickerSpecies,
  type PickerSpeciesItem,
} from '@/features/species/search-picker-species'
import { saveUserSighting } from '@/features/sightings/save-user-sighting'
import { useTaxaPhoto } from '@/features/species/use-taxa-photo'

const SEARCH_DEBOUNCE_MS = 400

export function ManualPickerScreen() {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const params = useLocalSearchParams<{
    uri?: string
    category?: string
    hintName?: string
    hintKingdom?: string
  }>()
  const photoUri = typeof params.uri === 'string' ? params.uri : undefined
  const categoryHint = parsePipelineCategory(
    typeof params.category === 'string' ? params.category : undefined,
  )
  const initialKingdomFilter = pipelineCategoryToPickerFilter(categoryHint)
  const hintName = typeof params.hintName === 'string' ? params.hintName : undefined

  const [kingdomFilter, setKingdomFilter] = useState<PickerKingdomFilter>(initialKingdomFilter)
  const [query, setQuery] = useState(hintName ?? '')
  const [debouncedQuery, setDebouncedQuery] = useState(hintName ?? '')
  const [items, setItems] = useState<PickerSpeciesItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSavingUnknown, setIsSavingUnknown] = useState(false)
  const [isSavingSelection, setIsSavingSelection] = useState(false)

  const cardWidth = (width - screenLayout.padH * 2 - space[16]) / 2

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      try {
        const results = await searchPickerSpecies(debouncedQuery, kingdomFilter)
        if (!cancelled) setItems(results)
      } catch (error) {
        if (__DEV__) console.warn('[WildKind picker] search failed', error)
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, kingdomFilter])

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/capture/scan')
  }, [])

  const handleSelectSpecies = useCallback(
    async (item: PickerSpeciesItem) => {
      if (isSavingSelection) return

      const speciesId = pickerItemToLookupId(item)
      const kingdom = item.kingdom as KingdomKey

      setIsSavingSelection(true)
      const saveResult = await saveUserSighting({
        speciesId,
        speciesName: item.commonName,
        kingdom,
        latinName: item.latinName,
        dexNumber: item.dexNumber,
        isDomestic: item.isDomestic,
        photoUri,
      })
      setIsSavingSelection(false)

      if (!saveResult.ok) {
        Alert.alert(
          'Could not save',
          saveResult.errorMessage ?? 'Sign in to add finds to your collection.',
        )
        return
      }

      router.replace({
        pathname: '/species/[id]',
        params: {
          id: speciesId,
          name: item.commonName,
          kingdom,
          number: item.dexNumber ?? '',
          ...(item.latinName ? { latin: item.latinName } : {}),
          ...(item.isDomestic ? { domestic: '1' } : {}),
          ...(photoUri ? { capturePhotoUri: photoUri } : {}),
          fromCapture: '1',
          saved: '1',
        },
      })
    },
    [isSavingSelection, photoUri],
  )

  const handleNotSure = useCallback(async () => {
    if (!photoUri || isSavingUnknown) return
    setIsSavingUnknown(true)
    try {
      await saveUnidentifiedSighting(photoUri)
      router.replace('/(tabs)/dex')
    } finally {
      setIsSavingUnknown(false)
    }
  }, [isSavingUnknown, photoUri])

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <View style={styles.titleRow}>
          <View style={styles.titleTextCol}>
            <Text style={styles.title}>What did you spot?</Text>
            <Text style={styles.subtitle}>Help us identify this one</Text>
          </View>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbPlaceholder]} />
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsRow}>
          {PICKER_KINGDOM_TABS.map((tab) => {
            const active = kingdomFilter === tab.id
            return (
              <Pressable
                key={tab.id}
                accessibilityRole="button"
                accessibilityLabel={`Filter by ${tab.label}`}
                onPress={() => setKingdomFilter(tab.id)}
                style={[
                  styles.tabPill,
                  { backgroundColor: active ? tab.color : tab.tint },
                  active && styles.tabPillActive,
                ]}>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.emoji} {tab.label}</Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.dim} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search species…"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
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
    ),
    [kingdomFilter, photoUri, query],
  )

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Identify</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleBack}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}>
          <Ionicons name="close" size={screenLayout.iconSize} color={colors.ink} />
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + space[56] + space[40] },
        ]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyWrap}>
              <ActivityIndicator color={colors.green} />
            </View>
          ) : (
            <Text style={styles.emptyText}>No species found. Try another search.</Text>
          )
        }
        renderItem={({ item }) => (
          <PickerSpeciesCard
            item={item}
            width={cardWidth}
            onPress={() => void handleSelectSpecies(item)}
          />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + space[16] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save as unidentified"
          onPress={handleNotSure}
          disabled={isSavingUnknown}
          style={({ pressed }) => [styles.notSureButton, pressed && styles.notSurePressed]}>
          {isSavingUnknown ? (
            <ActivityIndicator color={colors.green} />
          ) : (
            <Text style={styles.notSureLabel}>I'm not sure</Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

interface PickerSpeciesCardProps {
  item: PickerSpeciesItem
  width: number
  onPress: () => void
}

function PickerSpeciesCard({ item, width, onPress }: PickerSpeciesCardProps) {
  const { url: taxaUrl } = useTaxaPhoto(
    item.imageUrl ? null : item.commonName,
    item.kingdom,
    item.imageUrl ? null : item.latinName,
  )
  const imageUrl = item.imageUrl ?? taxaUrl

  if (__DEV__) {
    console.log('CARD RECEIVED IMAGE', {
      name: item.commonName,
      kingdom: item.kingdom,
      isDomestic: item.isDomestic,
      item_imageUrl: item.imageUrl,
    })
    console.log('CARD RENDER IMAGE URI', {
      name: item.commonName,
      taxaUrl,
      finalImageUrl: imageUrl,
      source: item.imageUrl ? 'registry' : taxaUrl ? 'useTaxaPhoto' : 'none',
    })
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Select ${item.commonName}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width }, pressed && styles.cardPressed]}>
      <View style={styles.cardArt}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            onError={(e) => {
              if (__DEV__) {
                console.log('IMAGE LOAD ERROR', {
                  name: item.commonName,
                  uri: imageUrl,
                  error: e.error ?? 'unknown',
                })
              }
            }}
          />
        ) : (
          <LinearGradient
            colors={[...item.gradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 1 }}
          />
        )}
        {item.dexNumber ? (
          <Text style={styles.cardDex}>{item.dexNumber}</Text>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={2}>
          {item.commonName}
        </Text>
        <KingdomBadge kind={item.kingdom} />
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenLayout.padH,
    paddingTop: space[24],
    paddingBottom: space[16],
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  headerSpacer: {
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
  },
  closeBtn: {
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPressed: {
    opacity: screenLayout.iconPressedOpacity,
  },
  listContent: {
    paddingHorizontal: screenLayout.padH,
    gap: space[16],
  },
  listHeader: {
    gap: space[16],
    paddingBottom: space[8],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space[16],
  },
  titleTextCol: {
    flex: 1,
    gap: space[4],
  },
  title: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabsRow: {
    gap: space[8],
    paddingRight: screenLayout.padH,
  },
  tabPill: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'transparent',
  },
  tabPillActive: {
    borderColor: 'rgba(21,33,48,0.12)',
  },
  tabLabel: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  tabLabelActive: {
    color: colors.card,
  },
  searchWrap: {
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
  searchInput: {
    flex: 1,
    fontSize: typeTokens.size.body,
    color: colors.ink,
    padding: 0,
  },
  gridRow: {
    gap: space[16],
    marginBottom: space[16],
  },
  emptyWrap: {
    paddingVertical: space[24],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: space[24],
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...dexCardHairline,
    ...shadow.card,
  },
  cardPressed: {
    opacity: 0.9,
  },
  cardArt: {
    height: 108,
    backgroundColor: colors.hairline,
  },
  cardDex: {
    position: 'absolute',
    left: space[8],
    bottom: space[8],
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
    letterSpacing: 0.5,
  },
  cardBody: {
    padding: space[8],
    gap: space[8],
  },
  cardName: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    minHeight: 36,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenLayout.padH,
    paddingTop: space[16],
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  notSureButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  notSurePressed: {
    opacity: 0.6,
  },
  notSureLabel: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
    textDecorationLine: 'underline',
  },
})
