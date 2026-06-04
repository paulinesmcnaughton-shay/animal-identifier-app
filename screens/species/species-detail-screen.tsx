import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { router, useLocalSearchParams } from 'expo-router'
import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  SpeciesDexDetailSections,
  SpeciesGameStatsGrid,
} from '@/components/species/SpeciesDexDetailSections'
import { Button } from '@/design/atoms/Button'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { ScreenHeader, ScreenHeaderIconButton } from '@/design/atoms/ScreenHeader'
import { screenLayout } from '@/design/screen-layout'
import { resolveRouteParam } from '@/data/species-catalog'
import { isPlaceholderDexNumber } from '@/features/species/resolve-dex-number'
import { getLocalSpeciesHeroImage } from '@/features/species/resolve-species-hero-image'
import { useSpeciesUserSightings } from '@/features/sightings/use-species-user-sightings'
import { useSpeciesDetail } from '@/features/species/use-species-detail'
import { fetchSpeciesReferencePhotos, useTaxaPhoto } from '@/features/species/use-taxa-photo'
import {
  colors,
  profileCardShadow as profileCardShadowStyle,
  radius,
  space,
  type as typeTokens,
} from '@/design/tokens'

const RARITY_BADGE_BG: Record<string, string> = {
  Rare: colors.sun,
  'Very Rare': colors.coralDeep,
}

const GLASS_RARITY_LABELS = new Set(['Common', 'Uncommon'])

function rarityChipVariantStyle(rarity: string) {
  if (GLASS_RARITY_LABELS.has(rarity)) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    }
  }
  return { backgroundColor: RARITY_BADGE_BG[rarity] ?? colors.earth }
}

function isGlassRarityChip(rarity: string): boolean {
  return GLASS_RARITY_LABELS.has(rarity)
}

export function SpeciesDetailScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const params = useLocalSearchParams<{
    id?: string | string[]
    name?: string | string[]
    number?: string | string[]
    kingdom?: string | string[]
    confidence?: string | string[]
    latin?: string | string[]
    domestic?: string | string[]
    fromCapture?: string | string[]
    saved?: string | string[]
    capturePhotoUri?: string | string[]
  }>()

  const fromCapture = resolveRouteParam(params.fromCapture) === '1'
  const savedToCollection = resolveRouteParam(params.saved) === '1'
  const capturePhotoUri = resolveRouteParam(params.capturePhotoUri) ?? undefined

  const id = resolveRouteParam(params.id) ?? 'unknown'
  const paramName = resolveRouteParam(params.name)
  const paramLatin = resolveRouteParam(params.latin)
  const isDomesticRoute = resolveRouteParam(params.domestic) === '1'
  const paramNumber = resolveRouteParam(params.number)
  const kingdomRaw = resolveRouteParam(params.kingdom)
  const kingdomOverride =
    kingdomRaw && kingdomRaw in KINGDOM ? (kingdomRaw as KingdomKey) : undefined
  const dexOverride =
    paramNumber && !isPlaceholderDexNumber(paramNumber) ? paramNumber : undefined

  const { species, heroImageUrl, isLoading: isSpeciesLoading } = useSpeciesDetail({
    id,
    isDomestic: isDomesticRoute,
    latinNameHint: paramLatin,
    overrides: {
      commonName: paramName,
      ...(paramLatin ? { latinName: paramLatin } : {}),
      ...(dexOverride ? { dexNumber: dexOverride } : {}),
      kingdom: kingdomOverride,
      spottedAt: paramName ? undefined : 'Just now',
    },
  })

  const localHeroImage = useMemo(
    () =>
      getLocalSpeciesHeroImage(id) ??
      getLocalSpeciesHeroImage(paramName ?? '') ??
      getLocalSpeciesHeroImage(species.commonName),
    [id, paramName, species.commonName],
  )

  const { url: taxaPhotoUrl } = useTaxaPhoto(species.commonName, species.kingdom, species.latinName)

  const userSightings = useSpeciesUserSightings(id)
  const heroArtWidth = screenWidth - screenLayout.padH * 2

  const [referencePhotos, setReferencePhotos] = useState<string[]>([])

  useEffect(() => {
    if (!species.commonName && !species.latinName) {
      setReferencePhotos([])
      return
    }
    let cancelled = false
    fetchSpeciesReferencePhotos(species.commonName, species.latinName ?? undefined, 5)
      .then((urls) => { if (!cancelled) setReferencePhotos(urls) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [species.commonName, species.latinName])

  const photoUrls = useMemo(() => {
    if (localHeroImage) return []

    const seen = new Set<string>()
    const all: string[] = []

    const hero = heroImageUrl?.trim()
    if (hero && !seen.has(hero)) { seen.add(hero); all.push(hero) }

    for (const url of referencePhotos) {
      if (url && !seen.has(url)) { seen.add(url); all.push(url) }
    }

    // taxaPhotoUrl as single-photo fallback if fetchSpeciesReferencePhotos returned nothing
    if (all.length === 0 && taxaPhotoUrl && !seen.has(taxaPhotoUrl)) all.push(taxaPhotoUrl)

    return all
  }, [heroImageUrl, referencePhotos, taxaPhotoUrl, localHeroImage])

  const [activePhotoIndex, setActivePhotoIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const kingdomMeta = KINGDOM[species.kingdom]

  const handleBack = () => {
    if (fromCapture) {
      router.dismiss(1)
      return
    }
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/dex')
  }

  const handleView3d = () => {
    router.push({ pathname: '/capture/view3d', params: { name: species.commonName } })
  }

  const handleGoToDex = () => {
    router.replace('/(tabs)/dex')
  }

  const footerHeight = space[16] + space[16] + 48 + insets.bottom

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top,
            paddingBottom: fromCapture ? footerHeight + space[24] : insets.bottom + space[32],
          },
        ]}>
        <ScreenHeader
          onBack={handleBack}
          center={<Text style={styles.headerDex}>{species.dexNumber}</Text>}
          right={
            <ScreenHeaderIconButton
              accessibilityLabel="Share species"
              icon="share-social-outline"
              onPress={() => {}}
            />
          }
          style={styles.screenHeaderInset}
        />

        <View style={styles.profileCardShadow}>
          <View style={styles.profileCard}>
          <View style={styles.heroArt}>
            {isSpeciesLoading ? (
              <View style={styles.heroLoading}>
                <ActivityIndicator color={colors.card} size="large" />
              </View>
            ) : photoUrls.length > 0 ? (
              <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={(e) =>
                  setActivePhotoIndex(Math.round(e.nativeEvent.contentOffset.x / heroArtWidth))
                }
                style={{ width: heroArtWidth, height: HERO_HEIGHT }}>
                {photoUrls.map((uri, i) => (
                  <Image
                    key={i}
                    source={{ uri }}
                    style={{ width: heroArtWidth, height: HERO_HEIGHT }}
                    contentFit="cover"
                    contentPosition="center"
                  />
                ))}
              </ScrollView>
            ) : localHeroImage ? (
              <Image
                source={localHeroImage}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            ) : (
              <LinearGradient
                colors={[...species.gradient]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              />
            )}

            {photoUrls.length > 1 ? (
              <View style={styles.photoDots} pointerEvents="none">
                {photoUrls.map((_, i) => (
                  <View
                    key={i}
                    style={[styles.photoDot, i === activePhotoIndex && styles.photoDotActive]}
                  />
                ))}
              </View>
            ) : null}

            <View style={[styles.kingdomChip, { backgroundColor: kingdomMeta?.bg ?? colors.plum }]}>
              <Text style={styles.kingdomChipEmoji}>{kingdomMeta?.emoji ?? '🌿'}</Text>
              <Text style={styles.kingdomChipLabel}>{kingdomMeta?.label?.toUpperCase() ?? 'SPECIES'}</Text>
            </View>

            <View style={[styles.rarityChip, rarityChipVariantStyle(species.rarity)]}>
              <Ionicons
                name="star"
                size={12}
                color={isGlassRarityChip(species.rarity) ? colors.ink : colors.card}
              />
              <Text
                style={[
                  styles.rarityChipText,
                  isGlassRarityChip(species.rarity) && styles.rarityChipTextGlass,
                ]}>
                {species.rarity}
              </Text>
            </View>

            <HeroActionButton
              accessibilityLabel="View in 3D"
              onPress={handleView3d}
              position="left">
              <Ionicons name="cube-outline" size={18} color={colors.ink} />
            </HeroActionButton>

            <HeroActionButton
              accessibilityLabel="Play species sound"
              onPress={() => {}}
              position="right">
              <Ionicons name="volume-high" size={18} color={colors.ink} />
            </HeroActionButton>
          </View>

          <View style={styles.profileBody}>
            {savedToCollection ? (
              <View style={styles.savedBanner}>
                <Ionicons name="checkmark-circle" size={18} color={colors.green} />
                <Text style={styles.savedBannerText}>Added to Wild Dex & My Sightings</Text>
              </View>
            ) : null}
            <Text style={styles.commonName}>{species.commonName}</Text>
            <Text style={styles.latinName}>{species.latinName}</Text>

            {species.kingdom !== 'plant' && species.kingdom !== 'tree' && species.kingdom !== 'flower' ? (
              <View style={styles.gameStatsWrap}>
                <SpeciesGameStatsGrid species={species} />
              </View>
            ) : null}
          </View>
          </View>
        </View>

        <SpeciesDexDetailSections
          species={species}
          showDexNumber={false}
          showStats={false}
        />

        {userSightings.length > 0 ? (
          <UserSightingsSection sightings={userSightings} />
        ) : null}
      </ScrollView>

      {fromCapture ? (
        <View
          style={[styles.captureFooter, { paddingBottom: insets.bottom + space[16] }]}
          pointerEvents="box-none">
          <LinearGradient
            colors={['rgba(255,248,231,0)', colors.bg]}
            style={styles.captureFooterFade}
            pointerEvents="none"
          />
          <View style={styles.captureFooterButtonWrap}>
            <Button label="Go to Dex" onPress={handleGoToDex} style={styles.captureFooterButton} />
          </View>
        </View>
      ) : null}
    </View>
  )
}

interface HeroActionButtonProps {
  accessibilityLabel: string
  onPress: () => void
  position: 'left' | 'right'
  children: ReactNode
}

function HeroActionButton({
  accessibilityLabel,
  onPress,
  position,
  children,
}: HeroActionButtonProps) {
  return (
    <View
      style={[
        styles.heroActionShadow,
        position === 'left' ? styles.heroActionBtnLeft : styles.heroActionBtnRight,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.heroActionBtn,
          pressed && styles.heroActionBtnPressed,
        ]}>
        {children}
      </Pressable>
    </View>
  )
}

function formatSightingDate(iso: string): string {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  )
}

function useReverseGeocode(lat: number | null, lng: number | null): string {
  const [place, setPlace] = useState<string>('')

  useEffect(() => {
    if (lat == null || lng == null) {
      setPlace('GPS off — no location found')
      return
    }
    void Location.reverseGeocodeAsync({ latitude: lat, longitude: lng })
      .then((results) => {
        const r = results[0]
        if (!r) { setPlace('Location unavailable'); return }
        const parts = [r.city ?? r.district, r.region ?? r.country].filter(Boolean)
        setPlace(parts.join(', ') || 'Unknown location')
      })
      .catch(() => setPlace('Location unavailable'))
  }, [lat, lng])

  return place
}

interface SightingRowProps {
  sighting: import('@/features/sightings/use-species-user-sightings').SpeciesSighting
  isLast: boolean
}

function SightingRow({ sighting: s, isLast }: SightingRowProps) {
  const place = useReverseGeocode(s.latitude, s.longitude)
  return (
    <View style={[sightingStyles.row, !isLast && sightingStyles.rowBorder]}>
      {s.photoUri ? (
        <Image source={{ uri: s.photoUri }} style={sightingStyles.thumb} contentFit="cover" />
      ) : (
        <View style={[sightingStyles.thumb, sightingStyles.thumbPlaceholder]}>
          <Ionicons name="paw" size={18} color={colors.dim} />
        </View>
      )}
      <View style={sightingStyles.meta}>
        <Text style={sightingStyles.date}>{formatSightingDate(s.spottedAt)}</Text>
        <View style={sightingStyles.locationRow}>
          <Ionicons
            name={s.latitude != null ? 'location-outline' : 'location-outline'}
            size={12}
            color={colors.dim}
          />
          <Text style={sightingStyles.location} numberOfLines={1}>{place || '…'}</Text>
        </View>
      </View>
    </View>
  )
}

interface UserSightingsSectionProps {
  sightings: import('@/features/sightings/use-species-user-sightings').SpeciesSighting[]
}

function UserSightingsSection({ sightings }: UserSightingsSectionProps) {
  return (
    <View style={sightingStyles.section}>
      <Text style={sightingStyles.sectionTitle}>SIGHTINGS</Text>
      <View style={sightingStyles.list}>
        {sightings.map((s, i) => (
          <SightingRow key={s.id} sighting={s} isLast={i === sightings.length - 1} />
        ))}
      </View>
    </View>
  )
}

const sightingStyles = StyleSheet.create({
  section: {
    gap: space[8],
  },
  sectionTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: space[4],
  },
  list: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    paddingHorizontal: space[16],
    paddingVertical: space[16],
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: radius.sm,
  },
  thumbPlaceholder: {
    backgroundColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {
    flex: 1,
    gap: space[4],
  },
  date: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
  },
  location: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
})

const HERO_HEIGHT = 220

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerDex: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: screenLayout.padH,
    gap: space[16],
  },
  screenHeaderInset: {
    marginHorizontal: -screenLayout.padH,
    paddingHorizontal: screenLayout.padH,
    backgroundColor: colors.bg,
  },
  profileCardShadow: {
    borderRadius: radius.xl,
    ...profileCardShadowStyle,
  },
  profileCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    overflow: 'visible',
  },
  heroArt: {
    height: HERO_HEIGHT,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  heroLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink2,
  },
  savedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginBottom: space[8],
    paddingVertical: space[8],
    paddingHorizontal: space[16],
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  savedBannerText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  profileBody: {
    position: 'relative',
    backgroundColor: colors.card,
    paddingHorizontal: space[16],
    paddingTop: space[16],
    paddingBottom: space[16],
    gap: space[4],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  kingdomChip: {
    position: 'absolute',
    top: space[16],
    left: space[16],
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  kingdomChipEmoji: {
    fontSize: 14,
  },
  kingdomChipLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
    letterSpacing: 0.5,
  },
  rarityChip: {
    position: 'absolute',
    top: space[16],
    right: space[16],
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  rarityChipText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  rarityChipTextGlass: {
    color: colors.ink,
  },
  heroActionShadow: {
    position: 'absolute',
    bottom: space[16],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(21, 33, 48, 0.22)',
    paddingBottom: 4,
    zIndex: 3,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  heroActionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroActionBtnPressed: {
    transform: [{ translateY: 1 }],
  },
  heroActionBtnLeft: {
    left: space[8],
  },
  heroActionBtnRight: {
    right: space[8],
  },
  commonName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  latinName: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    fontStyle: 'italic',
    color: colors.ink2,
    marginBottom: space[16],
  },
  gameStatsWrap: {
    marginTop: space[4],
  },
  captureFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: screenLayout.padH,
    paddingTop: space[24],
    backgroundColor: colors.bg,
  },
  captureFooterFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -space[32],
    height: space[32],
  },
  captureFooterButtonWrap: {
    width: '100%',
  },
  captureFooterButton: {
    alignSelf: 'stretch',
  },
  photoDots: {
    position: 'absolute',
    bottom: space[8],
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: space[4],
    zIndex: 4,
  },
  photoDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  photoDotActive: {
    backgroundColor: colors.card,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
