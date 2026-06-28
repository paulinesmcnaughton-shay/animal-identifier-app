import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import type { IdentifySource } from '@/features/identify/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Animated, Easing, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { SHEET_ENTER_TIMING } from '@/lib/draggable-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { LocationPickerModal } from '@/components/capture/LocationPickerModal'
import { contentTopInset } from '@/design/screen-layout'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { slugifySpeciesName } from '@/data/species-catalog'
import { identifyAnimalOrPlant } from '@/features/identify/identify-image'
import { buildManualPickerRouteParams } from '@/features/identify/manual-picker-params'
import type { IdentResult, PipelineCategory } from '@/features/identify/types'
import { MANUAL_PICKER_CONFIDENCE_THRESHOLD } from '@/features/identify/types'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { saveUserSighting } from '@/features/sightings/save-user-sighting'
import { useCreatureOfWeek } from '@/features/home/creature-of-week'
import { loadDefaultShareAnonymously } from '@/features/sightings/nearby-sharing'

export function ResultScreen() {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const creatureOfWeek = useCreatureOfWeek()
  const params = useLocalSearchParams<{
    uri?: string
    identified?: string
    commonName?: string
    kingdom?: string
    confidence?: string
    source?: string
    errorMessage?: string
  }>()
  const photoUri = typeof params.uri === 'string' ? params.uri : undefined

  const prefilledResult: IdentResult | null =
    params.identified === '1' && typeof params.commonName === 'string'
      ? {
          commonName: params.commonName,
          kingdom:
            typeof params.kingdom === 'string' && params.kingdom.length > 0
              ? (params.kingdom as IdentResult['kingdom'])
              : null,
          confidence: Number(params.confidence) || 0,
          source: (params.source as IdentifySource) || 'inaturalist',
        }
      : null

  const hasPrefilledError =
    typeof params.errorMessage === 'string' && params.errorMessage.length > 0

  const initialResult: IdentResult | null = hasPrefilledError
    ? { commonName: 'Unknown Species', kingdom: null, confidence: 0, source: 'manual' }
    : prefilledResult

  const [isLoading, setIsLoading] = useState(!!photoUri && !prefilledResult && !hasPrefilledError)
  const [result, setResult] = useState<IdentResult | null>(initialResult)
  const [isLowConfidence, setIsLowConfidence] = useState(
    hasPrefilledError ||
      (prefilledResult !== null &&
        prefilledResult.confidence < MANUAL_PICKER_CONFIDENCE_THRESHOLD),
  )
  const [manualCategory, setManualCategory] = useState<PipelineCategory>('unknown')
  const [isSaving, setIsSaving] = useState(false)
  const [showDisclaimer, setShowDisclaimer] = useState(false)
  const [publishToMap, setPublishToMap] = useState(false)
  const [shareAnonymously, setShareAnonymously] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const pulseAnim = useRef(new Animated.Value(1)).current

  // Sharing is per-image and opt-in: every capture starts private. publishToMap
  // only becomes true when the user taps GPS → Confirm Pin for THIS photo. We
  // only pre-load the default IDENTITY (anonymous vs username) — never publish.
  useEffect(() => {
    void loadDefaultShareAnonymously().then(setShareAnonymously)
  }, [])

  const runIdentification = useCallback(async (imageUri: string) => {
    setIsLoading(true)
    setResult(null)
    setIsLowConfidence(false)

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    pulse.start()

    try {
      const outcome = await identifyAnimalOrPlant(imageUri)
      if (outcome.status === 'manual') {
        setManualCategory(outcome.category ?? 'unknown')
        setIsLowConfidence(true)
        setResult(
          outcome.hintCommonName
            ? {
                commonName: outcome.hintCommonName,
                kingdom: (outcome.hintKingdom as KingdomKey) ?? null,
                confidence: 0.45,
                source: 'manual',
              }
            : { commonName: 'Unknown Species', kingdom: null, confidence: 0, source: 'manual' },
        )
        return
      }
      setResult(outcome.result)
      if (outcome.result.confidence < MANUAL_PICKER_CONFIDENCE_THRESHOLD) {
        setIsLowConfidence(true)
      }
    } catch (error) {
      setIsLowConfidence(true)
      setManualCategory('unknown')
      setResult({ commonName: 'Unknown Species', kingdom: null, confidence: 0, source: 'manual' })
      if (__DEV__) console.warn('[WildKind iNat]', error)
    } finally {
      pulse.stop()
      pulseAnim.setValue(1)
      setIsLoading(false)
    }
  }, [pulseAnim])

  useEffect(() => {
    if (!photoUri || prefilledResult || hasPrefilledError) return
    void runIdentification(photoUri)
  }, [photoUri, prefilledResult, hasPrefilledError, runIdentification])

  const cardOffset = useSharedValue(windowHeight)

  useEffect(() => {
    if (!isLoading) {
      cardOffset.value = withTiming(0, SHEET_ENTER_TIMING)
    }
  }, [isLoading, cardOffset, windowHeight])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset.value }],
  }))

  const handleClose = () => {
    if (router.canDismiss()) router.dismiss(1)
    else router.replace('/capture/scan')
  }

  const handleAddToCollection = async () => {
    if (!result) {
      router.replace('/(tabs)/dex')
      return
    }

    const speciesId = result.lookupId ?? slugifySpeciesName(result.commonName)
    const kingdom = (result.kingdom ?? 'mammal') as KingdomKey

    setIsSaving(true)
    const saveResult = await saveUserSighting({
      speciesId,
      speciesName: result.commonName,
      kingdom,
      latinName: result.latinName,
      dexNumber: result.dexNumber,
      confidence: result.confidence,
      isDomestic: result.isDomestic,
      photoUri: photoUri,
      manualLatitude: pinnedCoords?.lat ?? null,
      manualLongitude: pinnedCoords?.lng ?? null,
      shareAnonymously: publishToMap ? shareAnonymously : undefined,
    })
    setIsSaving(false)

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
        name: result.commonName,
        kingdom,
        number: result.dexNumber ?? '',
        confidence: String(result.confidence),
        ...(result.latinName ? { latin: result.latinName } : {}),
        ...(result.isDomestic ? { domestic: '1' } : {}),
        ...(photoUri ? { capturePhotoUri: photoUri } : {}),
        fromCapture: '1',
        saved: '1',
      },
    })
  }

  const handleRetry = () => {
    if (photoUri) void runIdentification(photoUri)
  }

  const handleNotQuite = () => {
    router.push({
      pathname: '/identify/manual-picker',
      params: buildManualPickerRouteParams({
        uri: photoUri ?? '',
        category: manualCategory,
        hintCommonName:
          result?.commonName && result.commonName !== 'Unknown Species'
            ? result.commonName
            : undefined,
        hintKingdom: result?.kingdom ?? undefined,
      }),
    })
  }

  const notQuiteLabel =
    result?.kingdom === 'plant' ? 'Not quite — choose plants' : 'Not quite — choose species'

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0

  return (
    <View style={styles.root}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.photoFallback]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />

      <View style={[styles.topOverlay, { paddingTop: contentTopInset(insets.top) }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <Ionicons name="close" size={22} color={colors.card} />
        </Pressable>

        {!isLoading && result ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View in 3D"
            onPress={() => router.push({ pathname: '/capture/view3d', params: { name: result.commonName } })}
            style={({ pressed }) => [styles.view3dButton, pressed && styles.pressed]}>
            <Text style={styles.view3dText}>View in 3D</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulseInner} />
          <Text style={styles.loadingLabel}>Identifying…</Text>
        </View>
      ) : result ? (
        <ReAnimated.View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + space[16] },
            cardAnimatedStyle,
          ]}>
          <View style={styles.handleRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="AI disclaimer"
              onPress={() => setShowDisclaimer(true)}
              style={styles.infoBtn}
              hitSlop={12}>
              <Ionicons name="information-circle-outline" size={22} color={colors.dim} />
            </Pressable>
            <View style={styles.handle} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPublished ? 'Edit sighting location' : 'Pin and share sighting location'}
              onPress={() => setShowLocationPicker(true)}
              style={styles.gpsBtn}
              hitSlop={12}>
              <Ionicons
                name={isPublished ? 'location' : 'location-outline'}
                size={22}
                color={isPublished ? colors.green : colors.dim}
              />
            </Pressable>
          </View>
          <Text style={styles.speciesName}>{result.commonName}</Text>

          <View style={styles.metaRow}>
            {result.kingdom ? (
              <KingdomBadge kind={result.kingdom} />
            ) : (
              <View style={styles.unknownBadge}>
                <Ionicons name="help" size={13} color={colors.dim} />
                <Text style={styles.unknownBadgeText}>Unknown</Text>
              </View>
            )}
          </View>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
          </View>
          <View style={styles.confidenceBar}>
            <ProgressBar progress={result.confidence} />
          </View>

          <Text style={styles.privacyHint}>
            Your sighting is private.{'\n'}Tap the GPS icon to share on the Nearby map.
          </Text>

          {result.confidence > 0 ? (
            <PopButton
              label={
                isSaving
                  ? 'Saving…'
                  : result.commonName.trim().toLowerCase() ===
                      creatureOfWeek.commonName.trim().toLowerCase()
                    ? `Add to collection · +${creatureOfWeek.bonusXp} XP`
                    : 'Add to collection'
              }
              onPress={() => void handleAddToCollection()}
              disabled={isSaving}
            />
          ) : (
            <PopButton label="Choose species" onPress={handleNotQuite} />
          )}

          {result.confidence > 0 ? (
            <>
              {isLowConfidence ? (
                <Text style={styles.notSureHint}>Not sure? You can pick a different species below.</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={notQuiteLabel}
                onPress={handleNotQuite}
                style={styles.secondaryAction}>
                <Text style={styles.secondaryActionText}>{notQuiteLabel}</Text>
              </Pressable>
            </>
          ) : null}

          {result.confidence === 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Try again"
              onPress={handleRetry}
              style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Try again</Text>
            </Pressable>
          ) : null}
        </ReAnimated.View>
      ) : null}

      <LocationPickerModal
        visible={showLocationPicker}
        initialCoordinate={pinnedCoords ? [pinnedCoords.lng, pinnedCoords.lat] : null}
        defaultPublishToMap={publishToMap}
        defaultShareAnonymously={shareAnonymously}
        onClose={() => setShowLocationPicker(false)}
        onConfirm={(lat, lng, publish, anonymous) => {
          setPinnedCoords({ lat, lng })
          setPublishToMap(publish)
          setShareAnonymously(anonymous)
          setIsPublished(publish)
          setShowLocationPicker(false)
        }}
      />

      <Modal
        visible={showDisclaimer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDisclaimer(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDisclaimer(false)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalBody}>
              AI results can make mistakes. WildKind uses AI and third-party sources to suggest species and information, but results may be inaccurate or incomplete. Always use caution, stay at a safe distance, and verify important information with official or expert sources.
            </Text>
            <PopButton label="Done" onPress={() => setShowDisclaimer(false)} />
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

interface PopButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
}

function PopButton({ label, onPress, disabled }: PopButtonProps) {
  return (
    <View style={styles.popWrap}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.popButton,
          pressed && !disabled && styles.popPressed,
          disabled && styles.popDisabled,
        ]}>
        <Text style={styles.popLabel}>{label}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  photoFallback: {
    backgroundColor: colors.ink2,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,33,48,0.45)',
  },
  view3dButton: {
    minHeight: 44,
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.plum,
  },
  view3dText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  pressed: {
    opacity: 0.88,
  },
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
  },
  pulseOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.green}40`,
  },
  pulseInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
  },
  loadingLabel: {
    marginTop: 68,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    letterSpacing: 0.3,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...slideUpSheetShell(),
    paddingHorizontal: space[16],
    paddingTop: space[16],
  },
  handleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[16],
  },
  handleSpacer: {
    width: 22,
  },
  handle: {
    ...slideUpSheetHandle,
  },
  infoBtn: {
    width: 22,
    alignItems: 'center',
  },
  gpsBtn: {
    width: 22,
    alignItems: 'center',
  },
  speciesName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.6,
    marginBottom: space[16],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[16],
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[8],
  },
  confidenceLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  confidenceValue: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  confidenceBar: {
    marginBottom: space[40],
  },
  unknownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: colors.hairline,
    borderRadius: radius.pill,
    paddingHorizontal: space[8],
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  unknownBadgeText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  privacyHint: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: space[16],
  },
  notSureHint: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    marginTop: space[8],
  },
  aiDisclaimer: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: space[16],
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: space[16],
    marginTop: space[8],
  },
  secondaryActionText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  popWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  popButton: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  popPressed: {
    transform: [{ translateY: 2 }],
  },
  popDisabled: {
    opacity: 0.6,
  },
  popLabel: {
    color: colors.card,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: space[24],
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space[24],
    gap: space[16],
    width: '100%',
  },
  modalBody: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 21,
    textAlign: 'center',
  },
})
