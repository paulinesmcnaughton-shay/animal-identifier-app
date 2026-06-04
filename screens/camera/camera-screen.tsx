import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { StatusBar } from 'expo-status-bar'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import * as MediaLibrary from 'expo-media-library'
import { type Href, router } from 'expo-router'
import { useFocusEffect, useIsFocused } from '@react-navigation/native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  CaptureResultSheet,
  type CaptureResultSheetPhase,
} from '@/components/capture/CaptureResultSheet'
import { LocationPickerModal } from '@/components/capture/LocationPickerModal'
import { buildManualPickerRouteParams } from '@/features/identify/manual-picker-params'
import { ScanFrameOverlay, type ScanFramePhase } from '@/components/capture/ScanFrameOverlay'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { Button } from '@/design/atoms/Button'
import { contentTopInset } from '@/design/screen-layout'
import { slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { slugifySpeciesName } from '@/data/species-catalog'
import { identifyAnimalOrPlant } from '@/features/identify/identify-image'
import type { IdentResult } from '@/features/identify/types'
import { saveUserSighting } from '@/features/sightings/save-user-sighting'
import { loadSettingsPreferences } from '@/features/settings/preferences'
import { sharingPrefsFromSightingsVisibility } from '@/features/settings/sightings-sharing-prefs'

type Facing = 'back' | 'front'

const FRAME_WIDTH_RATIO = 0.65
const TOP_BAR_HEIGHT = 44
const SHUTTER_ROW_HEIGHT = 72

const MAX_ZOOM_FACTOR = 10
const MIN_ZOOM_FACTOR = 1
const ZOOM_CYCLE = [1, 2, 3, 5] as const

function formatZoom(factor: number): string {
  const r = Math.round(factor * 10) / 10
  return r % 1 === 0 ? `${r}×` : `${r.toFixed(1)}×`
}

function kingdomAccent(kingdom: KingdomKey | null): string {
  if (kingdom && kingdom in KINGDOM) return KINGDOM[kingdom].bg
  return colors.sun
}

type ManualIdentifyOutcome = Extract<
  Awaited<ReturnType<typeof identifyAnimalOrPlant>>,
  { status: 'manual' }
>

export function CameraScreen() {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()
  const frameSize = Math.round(screenWidth * FRAME_WIDTH_RATIO)
  const topViewportInset = insets.top + space[8] + TOP_BAR_HEIGHT + space[24]
  const bottomViewportInset = space[56] + SHUTTER_ROW_HEIGHT + insets.bottom + space[16]

  const cameraRef = useRef<CameraView>(null)
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captureSessionRef = useRef(0)
  const isFocusedRef = useRef(true)
  const resultSheetPhaseRef = useRef<CaptureResultSheetPhase>('hidden')
  const isFocused = useIsFocused()

  useEffect(() => {
    isFocusedRef.current = isFocused
  }, [isFocused])

  useEffect(() => {
    void loadSettingsPreferences().then((prefs) => {
      const sharing = sharingPrefsFromSightingsVisibility(prefs.sightingsVisibility)
      setPublishToMap(sharing.shareFindings)
      setShareAnonymously(!sharing.showUsername)
    })
  }, [])

  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<Facing>('back')
  const [flashOn, setFlashOn] = useState(false)
  const [zoomFactor, setZoomFactor] = useState(MIN_ZOOM_FACTOR)
  const baseZoomRef = useRef(MIN_ZOOM_FACTOR)
  const lastHapticPreset = useRef(MIN_ZOOM_FACTOR)

  const expoZoom = (zoomFactor - MIN_ZOOM_FACTOR) / (MAX_ZOOM_FACTOR - MIN_ZOOM_FACTOR)


  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      baseZoomRef.current = zoomFactor
    })
    .onUpdate((e) => {
      const next = Math.max(
        MIN_ZOOM_FACTOR,
        Math.min(MAX_ZOOM_FACTOR, baseZoomRef.current * e.scale),
      )
      setZoomFactor(next)
      const nearest = ZOOM_CYCLE.reduce((n, f) =>
        Math.abs(f - next) < Math.abs(n - next) ? f : n
      )
      if (nearest !== lastHapticPreset.current) {
        lastHapticPreset.current = nearest
        void Haptics.selectionAsync()
      }
    })
    .runOnJS(true)
  const [cameraSessionKey, setCameraSessionKey] = useState(0)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [captureError, setCaptureError] = useState<string | null>(null)
  const [overlayPhase, setOverlayPhase] = useState<ScanFramePhase>('idle')
  const [accentColor, setAccentColor] = useState<string>(colors.sun)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)
  const [capturedPhotoUri, setCapturedPhotoUri] = useState<string | null>(null)
  const [resultSheetPhase, setResultSheetPhase] = useState<CaptureResultSheetPhase>('hidden')
  const [captureResult, setCaptureResult] = useState<IdentResult | null>(null)
  const [captureSheetError, setCaptureSheetError] = useState<string | null>(null)
  const [manualOutcome, setManualOutcome] = useState<ManualIdentifyOutcome | null>(null)
  const [isSavingCollection, setIsSavingCollection] = useState(false)
  const [publishToMap, setPublishToMap] = useState(false)
  const [shareAnonymously, setShareAnonymously] = useState(true)
  const [isPublished, setIsPublished] = useState(false)
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [showLocationPicker, setShowLocationPicker] = useState(false)

  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current)
      lockTimerRef.current = null
    }
  }, [])

  useEffect(() => () => clearLockTimer(), [clearLockTimer])

  useEffect(() => {
    resultSheetPhaseRef.current = resultSheetPhase
  }, [resultSheetPhase])

  const dismissResultSheet = useCallback(() => {
    captureSessionRef.current += 1
    clearLockTimer()
    setResultSheetPhase('hidden')
    setCapturedPhotoUri(null)
    setCaptureResult(null)
    setCaptureSheetError(null)
    setManualOutcome(null)
    setOverlayPhase('idle')
    setAccentColor(colors.sun)
    setCaptureError(null)
    setPinnedCoords(null)
    setIsPublished(false)
  }, [clearLockTimer])

  const cancelActiveCapture = useCallback(() => {
    dismissResultSheet()
  }, [dismissResultSheet])

  const resetCameraSession = useCallback(() => {
    if (resultSheetPhaseRef.current !== 'hidden') return
    dismissResultSheet()
    setGalleryOpen(false)
    setZoomFactor(MIN_ZOOM_FACTOR)
    baseZoomRef.current = MIN_ZOOM_FACTOR
  }, [dismissResultSheet])

  useFocusEffect(
    useCallback(() => {
      resetCameraSession()

      return () => {
        captureSessionRef.current += 1
        clearLockTimer()
      }
    }, [resetCameraSession, clearLockTimer]),
  )

  const handleCameraReady = useCallback(() => {
    setIsCameraReady(true)
    setCaptureError(null)
  }, [])

  const handleCameraMountError = useCallback(
    (event: { message?: string; nativeEvent?: { message?: string } }) => {
      setIsCameraReady(false)
      const message = event.nativeEvent?.message ?? event.message
      setCaptureError(message || "Couldn't start the camera.")
    },
    [],
  )

  const handleClose = useCallback(() => {
    if (resultSheetPhase !== 'hidden') {
      dismissResultSheet()
      return
    }
    cancelActiveCapture()
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/home')
  }, [cancelActiveCapture, dismissResultSheet, resultSheetPhase])

  const handleCancelScan = useCallback(() => {
    cancelActiveCapture()
  }, [cancelActiveCapture])

  const handleToggleFlash = useCallback(() => {
    setFlashOn((on) => !on)
  }, [])

  const handleFlipCamera = useCallback(() => {
    setIsCameraReady(false)
    setCameraSessionKey((key) => key + 1)
    setFacing((current) => (current === 'back' ? 'front' : 'back'))
    setZoomFactor(MIN_ZOOM_FACTOR)
    baseZoomRef.current = MIN_ZOOM_FACTOR
  }, [])

  const handleAddToCollection = useCallback(async () => {
    if (!captureResult) return

    const speciesId =
      captureResult.lookupId ?? slugifySpeciesName(captureResult.commonName)
    const kingdom = (captureResult.kingdom ?? 'mammal') as KingdomKey

    setIsSavingCollection(true)
    const saveResult = await saveUserSighting({
      speciesId,
      speciesName: captureResult.commonName,
      kingdom,
      latinName: captureResult.latinName,
      dexNumber: captureResult.dexNumber,
      confidence: captureResult.confidence,
      isDomestic: captureResult.isDomestic,
      photoUri: capturedPhotoUri,
      manualLatitude: pinnedCoords?.lat ?? null,
      manualLongitude: pinnedCoords?.lng ?? null,
      publishToMap,
      shareAnonymously: publishToMap ? shareAnonymously : undefined,
    })
    setIsSavingCollection(false)

    if (!saveResult.ok) {
      Alert.alert(
        'Could not save',
        saveResult.errorMessage ?? 'Sign in to add finds to your collection.',
      )
      return
    }

    router.push({
      pathname: '/species/[id]',
      params: {
        id: speciesId,
        name: captureResult.commonName,
        kingdom,
        number: captureResult.dexNumber ?? '',
        confidence: String(captureResult.confidence),
        ...(captureResult.latinName ? { latin: captureResult.latinName } : {}),
        ...(captureResult.isDomestic ? { domestic: '1' } : {}),
        fromCapture: '1',
        saved: '1',
      },
    } as Href)
  }, [captureResult, capturedPhotoUri])

  const handleChooseSpecies = useCallback(() => {
    const uri = capturedPhotoUri
    if (!uri) return

    const outcome: ManualIdentifyOutcome = manualOutcome ?? {
      status: 'manual',
      uri,
      ...(captureResult?.commonName ? { hintCommonName: captureResult.commonName } : {}),
      ...(captureResult?.kingdom ? { hintKingdom: captureResult.kingdom } : {}),
    }

    router.push({
      pathname: '/identify/manual-picker',
      params: buildManualPickerRouteParams(outcome),
    } as Href)
  }, [captureResult, capturedPhotoUri, manualOutcome])

  const showCaptureResult = useCallback(
    (outcome: Awaited<ReturnType<typeof identifyAnimalOrPlant>>) => {
      if (outcome.status === 'manual') {
        setManualOutcome(outcome)
        const hint: IdentResult | null = outcome.hintCommonName
          ? {
              commonName: outcome.hintCommonName,
              kingdom: (outcome.hintKingdom as KingdomKey) ?? null,
              confidence: 0.45,
              source: 'manual',
            }
          : null
        setCaptureResult(hint)
        setCaptureSheetError(null)
        setResultSheetPhase(hint ? 'success' : 'manual')
        setOverlayPhase('idle')
        setAccentColor(hint ? kingdomAccent(hint.kingdom) : colors.sun)
        return
      }

      setManualOutcome(null)
      setCaptureResult(outcome.result)
      setCaptureSheetError(null)
      setResultSheetPhase('success')
      setAccentColor(kingdomAccent(outcome.result.kingdom))
      setOverlayPhase('idle')
    },
    [],
  )

  const runCaptureFlow = useCallback(
    async (uri: string, sessionId: number) => {
      const isActive = () =>
        sessionId === captureSessionRef.current && isFocusedRef.current

      if (!isActive()) return

      setOverlayPhase('processing')
      setAccentColor(colors.sun)
      setResultSheetPhase('loading')
      setCaptureResult(null)
      setCaptureSheetError(null)
      setManualOutcome(null)

      try {
        const outcome = await identifyAnimalOrPlant(uri)
        if (!isActive()) return

        setOverlayPhase('locked')
        lockTimerRef.current = setTimeout(() => {
          if (!isActive()) return
          showCaptureResult(outcome)
        }, 400)
      } catch (error) {
        if (!isActive()) return
        if (__DEV__) console.warn('[WildKind Camera]', error)
        setOverlayPhase('idle')
        setAccentColor(colors.sun)
        setCaptureResult(null)
        setCaptureSheetError(null)
        setManualOutcome(null)
        setResultSheetPhase('manual')
      }
    },
    [showCaptureResult],
  )

  const startCaptureFlow = useCallback(
    (uri: string) => {
      const sessionId = ++captureSessionRef.current
      setCapturedPhotoUri(uri)
      void runCaptureFlow(uri, sessionId)
    },
    [runCaptureFlow],
  )

  const handleRetryIdentification = useCallback(() => {
    if (!capturedPhotoUri) return
    const sessionId = ++captureSessionRef.current
    void runCaptureFlow(capturedPhotoUri, sessionId)
  }, [capturedPhotoUri, runCaptureFlow])

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || resultSheetPhase !== 'hidden' || !isCameraReady || !isFocused) return

    setCaptureError(null)

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
      })
      if (!photo?.uri) {
        throw new Error('Photo capture returned no image')
      }
      startCaptureFlow(photo.uri)
    } catch (error) {
      if (__DEV__) {
        console.warn('[WildKind Camera] takePictureAsync failed', error)
      }
      setCaptureError("Couldn't take a photo. Wait for the camera to load, then try again.")
      setOverlayPhase('idle')
      setAccentColor(colors.sun)
    }
  }, [isCameraReady, isFocused, resultSheetPhase, startCaptureFlow])

  const handleOpenGallery = useCallback(async () => {
    if (resultSheetPhase !== 'hidden') return
    setIsLoadingGallery(true)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') return
      const page = await MediaLibrary.getAssetsAsync({
        first: 48,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      })
      setGalleryAssets(page.assets)
      setGalleryOpen(true)
    } finally {
      setIsLoadingGallery(false)
    }
  }, [overlayPhase])

  const handleSelectGalleryAsset = useCallback(
    async (asset: MediaLibrary.Asset) => {
      if (resultSheetPhase !== 'hidden') return
      setGalleryOpen(false)
      const info = await MediaLibrary.getAssetInfoAsync(asset, {
        shouldDownloadFromNetwork: true,
      })
      const uri = info.localUri ?? asset.uri
      startCaptureFlow(uri)
    },
    [resultSheetPhase, startCaptureFlow],
  )

  const isIdentifying = resultSheetPhase === 'loading'
  const isShowingResult = resultSheetPhase !== 'hidden'
  const canCapture = isCameraReady && !isShowingResult && isFocused

  if (!permission) {
    return (
      <View style={[styles.centered, styles.darkScreen]}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.card} />
      </View>
    )
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain !== false
    const handleEnableCamera = () => {
      if (canAskAgain) void requestPermission()
      else void Linking.openSettings()
    }

    return (
      <View style={[styles.centered, styles.darkScreen, styles.permissionScreen]}>
        <StatusBar style="light" />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          {canAskAgain
            ? 'WildKind uses your camera to identify animals and insects in the wild.'
            : 'Camera was turned off for WildKind. Open Settings → Privacy & Security → Camera and enable WildKind, or tap below.'}
        </Text>
        <Button
          label={canAskAgain ? 'Allow camera' : 'Open Settings'}
          onPress={handleEnableCamera}
          style={styles.permissionButton}
        />
        {canAskAgain ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleClose}
            style={styles.permissionBack}>
            <Text style={styles.permissionBackText}>Not now</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <GestureDetector gesture={pinchGesture}>
    <View style={styles.root}>
      <StatusBar style="light" />
      <CameraView
        key={cameraSessionKey}
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        mode="picture"
        active={isFocused}
        flash={flashOn ? 'on' : 'off'}
        zoom={expoZoom}
        onCameraReady={handleCameraReady}
        onMountError={handleCameraMountError}
      />

      {capturedPhotoUri ? (
        <>
          <Image source={{ uri: capturedPhotoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={styles.previewOverlay} />
        </>
      ) : null}

      {!isShowingResult || isIdentifying ? (
        <ScanFrameOverlay
          phase={overlayPhase}
          frameSize={frameSize}
          topViewportInset={topViewportInset}
          bottomViewportInset={bottomViewportInset}
          accentColor={accentColor}
        />
      ) : null}

      <LinearGradient
        colors={['rgba(21,33,48,0.55)', 'transparent']}
        style={[styles.topGradient, { paddingTop: contentTopInset(insets.top) }]}
        pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={handleClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}>
            <Ionicons name="close" size={24} color={colors.card} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
            onPress={handleToggleFlash}
            disabled={isShowingResult}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}>
            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={22} color={colors.card} />
          </Pressable>
        </View>
      </LinearGradient>

      {!isShowingResult ? (
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={[styles.bottomGradient, { paddingBottom: insets.bottom + space[16] }]}
          pointerEvents="box-none">
          {captureError ? (
            <Text style={styles.captureError} accessibilityLiveRegion="polite">
              {captureError}
            </Text>
          ) : null}

          {facing === 'back' && zoomFactor > ZOOM_CYCLE[ZOOM_CYCLE.length - 1] ? (
            <View style={styles.zoomLevelWrap} pointerEvents="none">
              <Text style={styles.zoomLevelText}>{formatZoom(zoomFactor)}</Text>
            </View>
          ) : null}

          {facing === 'back' ? (
            <View style={styles.zoomRow}>
              {ZOOM_CYCLE.map((factor) => {
                const isActive = Math.abs(zoomFactor - factor) < 0.5 &&
                  ZOOM_CYCLE.every(f => f === factor || Math.abs(zoomFactor - factor) <= Math.abs(zoomFactor - f))
                return (
                  <Pressable
                    key={factor}
                    accessibilityRole="button"
                    accessibilityLabel={`Zoom ${factor}x`}
                    accessibilityState={{ selected: isActive }}
                    onPress={() => {
                      setZoomFactor(factor)
                      baseZoomRef.current = factor
                      lastHapticPreset.current = factor
                      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    }}
                    style={({ pressed }) => [
                      styles.zoomPill,
                      isActive && styles.zoomPillActive,
                      pressed && styles.zoomPillPressed,
                    ]}>
                    <Text style={[styles.zoomLabel, isActive && styles.zoomLabelActive]}>
                      {isActive ? formatZoom(zoomFactor) : `${factor}×`}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}

          <View style={styles.bottomBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose from photo library"
              onPress={handleOpenGallery}
              disabled={isLoadingGallery}
              style={({ pressed }) => [styles.sideControl, pressed && styles.iconPressed]}>
              {isLoadingGallery ? (
                <ActivityIndicator color={colors.card} size="small" />
              ) : (
                <Ionicons name="images-outline" size={28} color={colors.card} />
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={canCapture ? 'Take photo' : 'Camera loading'}
              onPress={handleCapture}
              disabled={!canCapture}
              style={({ pressed }) => [
                styles.shutterOuter,
                !canCapture && styles.shutterDisabled,
                pressed && canCapture && styles.shutterPressed,
              ]}>
              <View style={[styles.shutterInner, !canCapture && styles.shutterInnerDisabled]} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Flip camera"
              onPress={handleFlipCamera}
              style={({ pressed }) => [styles.sideControl, pressed && styles.iconPressed]}>
              <Ionicons name="camera-reverse-outline" size={28} color={colors.card} />
            </Pressable>
          </View>
        </LinearGradient>
      ) : null}

      {isIdentifying ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel scan and take another photo"
          onPress={handleCancelScan}
          style={({ pressed }) => [
            styles.cancelScanFloating,
            { bottom: insets.bottom + space[24] },
            pressed && styles.iconPressed,
          ]}>
          <Text style={styles.cancelScanText}>Cancel — take another photo</Text>
        </Pressable>
      ) : null}

      <CaptureResultSheet
        phase={resultSheetPhase}
        result={captureResult}
        errorMessage={captureSheetError}
        manualHint={
          manualOutcome?.hintCommonName
            ? `We saw something like “${manualOutcome.hintCommonName}” — pick what matches best.`
            : undefined
        }
        bottomInset={insets.bottom}
        isSavingCollection={isSavingCollection}
        isPublished={isPublished}
        onAddToCollection={() => void handleAddToCollection()}
        onChooseSpecies={handleChooseSpecies}
        onRetake={dismissResultSheet}
        onRetry={handleRetryIdentification}
        onOpenLocationPicker={() => setShowLocationPicker(true)}
      />

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

      <GalleryPickerModal
        visible={galleryOpen}
        assets={galleryAssets}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleSelectGalleryAsset}
      />

    </View>
    </GestureDetector>
  )
}

interface GalleryPickerModalProps {
  visible: boolean
  assets: MediaLibrary.Asset[]
  onClose: () => void
  onSelect: (asset: MediaLibrary.Asset) => void
}

function GalleryPickerModal({ visible, assets, onClose, onSelect }: GalleryPickerModalProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const cellSize = (width - space[16] * 2 - space[4] * 2) / 3

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + space[16] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recent photos</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
              onPress={onClose}
              style={({ pressed }) => [styles.modalClose, pressed && styles.iconPressed]}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.galleryRow}
            contentContainerStyle={styles.galleryList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select photo"
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.galleryCell,
                  { width: cellSize, height: cellSize },
                  pressed && styles.galleryCellPressed,
                ]}>
                <Image source={{ uri: item.uri }} style={styles.galleryThumb} contentFit="cover" />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.galleryEmpty}>No photos found in your library.</Text>
            }
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  darkScreen: {
    backgroundColor: colors.ink,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionScreen: {
    paddingHorizontal: space[24],
  },
  permissionTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.card,
    textAlign: 'center',
    marginBottom: space[16],
  },
  permissionBody: {
    fontSize: typeTokens.size.bodyLG,
    color: colors.dim,
    textAlign: 'center',
    marginBottom: space[32],
    lineHeight: 24,
  },
  permissionButton: {
    alignSelf: 'stretch',
  },
  permissionBack: {
    marginTop: space[16],
    paddingVertical: space[16],
  },
  permissionBackText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconPressed: {
    opacity: 0.75,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space[56],
    paddingHorizontal: space[24],
  },
  captureError: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.coral,
    textAlign: 'center',
    marginBottom: space[16],
  },
  cancelScanFloating: {
    position: 'absolute',
    alignSelf: 'center',
    left: space[24],
    right: space[24],
    paddingVertical: space[8],
    paddingHorizontal: space[16],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(21,33,48,0.55)',
    zIndex: 15,
  },
  cancelScanText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    textAlign: 'center',
  },
  zoomLevelWrap: {
    alignItems: 'center',
    marginBottom: space[8],
  },
  zoomLevelText: {
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    letterSpacing: -0.5,
  },
  zoomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space[8],
    marginBottom: space[16],
  },
  zoomPill: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.55)',
    minWidth: 48,
    alignItems: 'center',
  },
  zoomPillActive: {
    backgroundColor: 'rgba(0,0,0,0.75)',
  },
  zoomPillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.93 }],
  },
  zoomLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 0.2,
  },
  zoomLabelActive: {
    color: colors.sun,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideControl: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shadow.pop,
  },
  shutterDisabled: {
    opacity: 0.45,
  },
  shutterPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  shutterInnerDisabled: {
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(21,33,48,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '72%',
    ...slideUpSheetShell(colors.bg),
    paddingTop: space[16],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
    marginBottom: space[16],
  },
  modalTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  galleryList: {
    paddingHorizontal: space[16],
    paddingBottom: space[8],
    gap: space[4],
  },
  galleryRow: {
    gap: space[4],
    marginBottom: space[4],
  },
  galleryCell: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.hairline,
  },
  galleryCellPressed: {
    opacity: 0.85,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  galleryEmpty: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: space[32],
  },
})
