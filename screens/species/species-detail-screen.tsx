import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import * as Location from 'expo-location'
import { router, useLocalSearchParams } from 'expo-router'
import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
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
import {
  isUserSightingShared,
  loadDefaultShareAnonymously,
  shareUserSighting,
  unshareUserSighting,
} from '@/features/sightings/nearby-sharing'
import { LocationPickerModal } from '@/components/capture/LocationPickerModal'
import { useSpeciesDetail } from '@/features/species/use-species-detail'
import { getSightingPhotoUri } from '@/features/species/get-display-image-uri'
import { useReferenceImage } from '@/features/species/use-reference-image'
import { suggestSpeciesPhoto, type SuggestPhotoSource } from '@/features/species/suggest-photo'
import { PhotoConsentSheet } from '@/components/species/PhotoConsentSheet'
import type { ImageAttribution } from '@/features/species/fetch-stored-reference-image'
import {
  colors,
  profileCardShadow as profileCardShadowStyle,
  radius,
  space,
  type as typeTokens,
} from '@/design/tokens'

// CC-BY credit shown over Wikimedia photos: "Photo: <author> · <license>".
function formatCredit(a: ImageAttribution): string {
  const parts = [a.author, a.license].filter(Boolean)
  return `Photo: ${parts.length ? parts.join(' · ') : 'Wikimedia Commons'}`
}

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
  }>()

  const fromCapture = resolveRouteParam(params.fromCapture) === '1'
  const savedToCollection = resolveRouteParam(params.saved) === '1'
  const confidenceRaw = resolveRouteParam(params.confidence)
  const confidence = confidenceRaw ? parseFloat(confidenceRaw) : null

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

  // Resolve the hero through the SAME resolver the Dex/roster mini cards use, so the
  // detail image is identical to the card (not a different iNat photo). Only the
  // domestic registry image is passed as an authoritative override; wild species
  // resolve purely from identity (commonName/latin/kingdom) → owned stored image.
  const {
    uri: heroDisplayUri,
    attribution: heroAttribution,
    isResolving: isHeroResolving,
    onImageError: onHeroError,
  } = useReferenceImage(
    {
      commonName: species.commonName,
      scientificName: species.latinName,
      speciesId: id,
      dexNum: species.dexNumber,
      kingdom: species.kingdom,
      isDomestic: isDomesticRoute,
      appRegistryImageUrl: null,
      domesticRegistryImageUrl: isDomesticRoute ? heroImageUrl : null,
    },
    { screen: 'species-detail', component: 'HeroImage' },
  )
  const userSightings = useSpeciesUserSightings(id)
  const primarySighting = userSightings[0] ?? null
  const primarySightingId = primarySighting?.id ?? null
  const [isShared, setIsShared] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [defaultAnonymous, setDefaultAnonymous] = useState(true)

  useEffect(() => {
    void loadDefaultShareAnonymously().then(setDefaultAnonymous)
  }, [])

  useEffect(() => {
    if (!primarySightingId) {
      setIsShared(false)
      return
    }
    let cancelled = false
    void isUserSightingShared(primarySightingId).then((shared) => {
      if (!cancelled) setIsShared(shared)
    })
    return () => {
      cancelled = true
    }
  }, [primarySightingId])

  const handleNearbySharePress = () => {
    if (!primarySightingId) return
    if (!isShared) {
      console.log('GPS ICON PRESSED', {
        source: 'species-detail',
        userSightingId: primarySightingId,
        isShared,
      })
      setShareModalOpen(true)
      return
    }
    Alert.alert(
      'Shared on Nearby',
      'This sighting is on the Nearby map. Remove it? Your photo stays in My Sightings and your Wild Dex.',
      [
        {
          text: 'Remove from Nearby',
          style: 'destructive',
          onPress: () => {
            void unshareUserSighting(primarySightingId).then(() => setIsShared(false))
          },
        },
        { text: 'Keep public', style: 'cancel' },
      ],
    )
  }

  const kingdomMeta = KINGDOM[species.kingdom]

  // True only once all async sources have resolved and there is still no reference image
  const heroImageResolved = !isSpeciesLoading && !isHeroResolving
  const hasReferenceImage = !!heroDisplayUri || !!localHeroImage
  const isNeedsId = heroImageResolved && !hasReferenceImage

  const isLowConfidence = confidence !== null && confidence < 0.7
  const showNeedsIdHint = fromCapture && (isNeedsId || isLowConfidence)

  const isUnidentified = id === 'unknown'
  // A genuine capture that still needs identifying keeps "Needs ID"; an identified
  // species we simply have no photo for says "No photo yet" and can be contributed to.
  const needsIdLabel = isUnidentified
    ? 'Unknown Species'
    : fromCapture && isLowConfidence
      ? 'Needs ID'
      : 'No photo yet'
  const needsIdEmoji = kingdomMeta?.emoji ?? '❓'
  const canSuggestPhoto = isNeedsId && !isUnidentified && !isLowConfidence

  const [photoSuggestStatus, setPhotoSuggestStatus] = useState<'idle' | 'submitting' | 'submitted'>('idle')
  const [isConsentSheetOpen, setIsConsentSheetOpen] = useState(false)
  const runPhotoSuggestion = async (source: SuggestPhotoSource) => {
    setIsConsentSheetOpen(false)
    setPhotoSuggestStatus('submitting')
    const result = await suggestSpeciesPhoto({
      speciesId: id,
      speciesName: species.commonName,
      latinName: species.latinName,
      kingdom: species.kingdom,
      dexNumber: species.dexNumber,
      isDomestic: isDomesticRoute,
      source,
    })
    if (result.status === 'submitted') {
      setPhotoSuggestStatus('submitted')
      return
    }
    setPhotoSuggestStatus('idle')
    if (result.status === 'signed-out')
      Alert.alert('Sign in to help', 'Sign in to suggest a photo for this species.')
    else if (result.status === 'error') Alert.alert('Could not submit', result.message)
  }
  const handleSuggestPhoto = () => setIsConsentSheetOpen(true)

  const handleBack = () => {
    if (fromCapture) {
      router.dismiss(1)
      return
    }
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/dex')
  }

  const handleGoToDex = () => {
    router.replace('/(tabs)/dex')
  }

  const footerHeight = space[24] + 48 + insets.bottom + space[16]

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
            ) : heroDisplayUri ? (
              <Image
                source={{ uri: heroDisplayUri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
                onError={() => onHeroError(heroDisplayUri)}
              />
            ) : localHeroImage ? (
              <Image
                source={localHeroImage}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="center"
              />
            ) : (
              <>
                <LinearGradient
                  colors={[...species.gradient]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0.2, y: 0 }}
                  end={{ x: 0.8, y: 1 }}
                />
                {isNeedsId ? (
                  <View style={styles.heroNoImageOverlay}>
                    <Text style={styles.heroNoImageEmoji}>{needsIdEmoji}</Text>
                    <Text style={styles.heroNoImageLabel}>{needsIdLabel}</Text>
                    {canSuggestPhoto ? (
                      photoSuggestStatus === 'submitted' ? (
                        <View style={styles.suggestDone}>
                          <Ionicons name="checkmark-circle" size={14} color={colors.card} />
                          <Text style={styles.suggestDoneText}>Thanks! Under review</Text>
                        </View>
                      ) : (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={`Suggest a photo of the ${species.commonName}`}
                          onPress={handleSuggestPhoto}
                          disabled={photoSuggestStatus === 'submitting'}
                          style={({ pressed }) => [styles.suggestBtn, pressed && styles.suggestBtnPressed]}>
                          {photoSuggestStatus === 'submitting' ? (
                            <ActivityIndicator size="small" color={colors.card} />
                          ) : (
                            <>
                              <Ionicons name="camera" size={14} color={colors.card} />
                              <Text style={styles.suggestBtnText}>Suggest a photo</Text>
                            </>
                          )}
                        </Pressable>
                      )
                    ) : null}
                  </View>
                ) : null}
              </>
            )}
            {heroDisplayUri && heroAttribution ? (
              <Pressable
                style={styles.heroCredit}
                accessibilityRole={heroAttribution.sourceUrl ? 'link' : 'text'}
                accessibilityLabel={`Photo credit: ${formatCredit(heroAttribution)}`}
                onPress={() => {
                  if (heroAttribution.sourceUrl) void Linking.openURL(heroAttribution.sourceUrl)
                }}>
                <Ionicons name="information-circle-outline" size={11} color="rgba(255,255,255,0.85)" />
                <Text style={styles.heroCreditText} numberOfLines={1}>
                  {formatCredit(heroAttribution)}
                </Text>
              </Pressable>
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
            {primarySightingId ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  isShared
                    ? 'Manage Nearby sharing for this sighting'
                    : 'Share this sighting on Nearby'
                }
                onPress={handleNearbySharePress}
                style={[styles.nearbyShareRow, isShared && styles.nearbyShareRowActive]}>
                <Ionicons
                  name={isShared ? 'location' : 'location-outline'}
                  size={16}
                  color={isShared ? colors.green : colors.dim}
                />
                <Text style={[styles.nearbyShareText, isShared && styles.nearbyShareTextActive]}>
                  {isShared ? 'Shared on Nearby — tap to manage' : 'Share this sighting on Nearby'}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isShared ? colors.green : colors.dim}
                />
              </Pressable>
            ) : null}
            {showNeedsIdHint ? (
              <View style={styles.needsIdBanner}>
                <Ionicons name="information-circle-outline" size={16} color={colors.dim} />
                <Text style={styles.needsIdBannerText}>
                  Saved to your sightings. You can identify this later.
                </Text>
              </View>
            ) : null}
            <Text style={styles.commonName}>{species.commonName}</Text>
            <Text style={styles.latinName}>{species.latinName}</Text>

            {species.kingdom !== 'plant' && species.kingdom !== 'tree' && species.kingdom !== 'flower' && species.kingdom !== 'fungi' ? (
              <View style={styles.gameStatsWrap}>
                <SpeciesGameStatsGrid species={species} />
              </View>
            ) : null}
          </View>
          </View>
        </View>

        {species.kingdom === 'fungi' ? (
          <View style={styles.fungiWarningBanner}>
            <Ionicons name="warning-outline" size={16} color="#8B5A00" />
            <Text style={styles.fungiWarningText}>
              Do not eat wild mushrooms based on app identification. Some mushrooms are poisonous or dangerous.
            </Text>
          </View>
        ) : null}

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

      <LocationPickerModal
        visible={shareModalOpen}
        initialCoordinate={
          primarySighting?.latitude != null && primarySighting?.longitude != null
            ? [primarySighting.longitude, primarySighting.latitude]
            : null
        }
        defaultPublishToMap
        defaultShareAnonymously={defaultAnonymous}
        onClose={() => setShareModalOpen(false)}
        onConfirm={(lat, lng, publish, anonymous) => {
          setShareModalOpen(false)
          if (!publish || !primarySightingId) return
          void shareUserSighting({
            userSightingId: primarySightingId,
            identity: anonymous ? 'anonymous' : 'public',
            latitude: lat,
            longitude: lng,
          }).then(() => setIsShared(true))
        }}
      />

      <PhotoConsentSheet
        visible={isConsentSheetOpen}
        speciesName={species.commonName}
        onSelectCamera={() => void runPhotoSuggestion('camera')}
        onSelectLibrary={() => void runPhotoSuggestion('library')}
        onCancel={() => setIsConsentSheetOpen(false)}
      />
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
  const [thumbFailed, setThumbFailed] = useState(false)
  const thumbUri = getSightingPhotoUri(s)
  const showThumb = !!thumbUri && !thumbFailed

  return (
    <View style={[sightingStyles.row, !isLast && sightingStyles.rowBorder]}>
      {showThumb ? (
        <Image
          source={{ uri: thumbUri }}
          style={sightingStyles.thumb}
          contentFit="cover"
          onError={(e) => {
            console.log('IMAGE FAILED', s.photoUri, e)
            setThumbFailed(true)
          }}
        />
      ) : (
        <View style={[sightingStyles.thumb, sightingStyles.thumbPlaceholder]}>
          <Ionicons name="paw" size={18} color={colors.dim} />
        </View>
      )}
      <View style={sightingStyles.meta}>
        <Text style={sightingStyles.date}>{formatSightingDate(s.spottedAt)}</Text>
        <View style={sightingStyles.locationRow}>
          <Ionicons name="location-outline" size={12} color={colors.dim} />
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
  nearbyShareRow: {
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
  nearbyShareRowActive: {
    borderColor: colors.greenLight,
  },
  nearbyShareText: {
    flex: 1,
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  nearbyShareTextActive: {
    color: colors.green,
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
  heroNoImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
  },
  heroNoImageEmoji: {
    fontSize: 48,
    textAlign: 'center',
  },
  heroNoImageLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  suggestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginTop: space[4],
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    minHeight: 36,
  },
  suggestBtnPressed: {
    opacity: 0.7,
    transform: [{ translateY: 1 }],
  },
  suggestBtnText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  suggestDone: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    marginTop: space[4],
  },
  suggestDoneText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  heroCredit: {
    position: 'absolute',
    left: space[8],
    bottom: space[8],
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: radius.sm,
    paddingHorizontal: space[8],
    paddingVertical: 3,
  },
  heroCreditText: {
    fontSize: 10,
    fontWeight: typeTokens.body.weights.medium,
    color: 'rgba(255,255,255,0.85)',
  },
  needsIdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    marginBottom: space[8],
    paddingVertical: space[8],
    paddingHorizontal: space[16],
    backgroundColor: colors.bg2,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  needsIdBannerText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
  fungiWarningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    marginHorizontal: space[16],
    marginBottom: space[16],
    paddingVertical: space[8],
    paddingHorizontal: space[16],
    backgroundColor: '#FFF8E1',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#FFD54F',
  },
  fungiWarningText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: '#8B5A00',
    lineHeight: 18,
  },
})
