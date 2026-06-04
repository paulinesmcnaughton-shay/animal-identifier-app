import { Camera, MapView } from '@rnmapbox/maps'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import ReAnimated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { SHEET_ENTER_TIMING, SHEET_EXIT_TIMING } from '@/lib/draggable-sheet'

const DEFAULT_CENTER: [number, number] = [-98, 39]
const DEFAULT_ZOOM = 3
const LOCATED_ZOOM = 14

interface LocationPickerModalProps {
  visible: boolean
  initialCoordinate?: [number, number] | null
  defaultPublishToMap?: boolean
  defaultShareAnonymously?: boolean
  onClose: () => void
  onConfirm: (lat: number, lng: number, publishToMap: boolean, shareAnonymously: boolean) => void
}

export function LocationPickerModal(props: LocationPickerModalProps) {
  return (
    <Modal
      visible={props.visible}
      animationType="slide"
      onRequestClose={props.onClose}>
      {props.visible ? <LocationPickerContent {...props} /> : null}
    </Modal>
  )
}

function LocationPickerContent({
  initialCoordinate,
  defaultPublishToMap = false,
  defaultShareAnonymously = true,
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const cameraRef = useRef<Camera>(null)
  const centerRef = useRef<[number, number]>(initialCoordinate ?? DEFAULT_CENTER)
  const fetchedCoordRef = useRef<[number, number] | null>(null)

  const [phase, setPhase] = useState<'map' | 'share'>('map')
  const [locationDenied, setLocationDenied] = useState(false)
  const [publishToMap, setPublishToMap] = useState(defaultPublishToMap)
  const [shareAnonymously, setShareAnonymously] = useState(defaultShareAnonymously)

  // Request permission on mount — fires the system dialog immediately when the
  // modal opens, before the map has finished loading. Stores the result in a ref
  // so handleMapReady can use it even if the map loads before location resolves.
  useEffect(() => {
    if (initialCoordinate) return

    let cancelled = false

    async function fetchLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (cancelled) return

        if (status !== 'granted') {
          setLocationDenied(true)
          return
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        if (cancelled) return

        const coord: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        fetchedCoordRef.current = coord
        centerRef.current = coord

        // Pan the camera directly if the map is already ready
        cameraRef.current?.setCamera({
          centerCoordinate: coord,
          zoomLevel: LOCATED_ZOOM,
          animationDuration: 600,
        })
      } catch {
        if (!cancelled) setLocationDenied(true)
      }
    }

    void fetchLocation()
    return () => { cancelled = true }
  }, [initialCoordinate])

  // If the map finishes loading before fetchLocation completes, center on
  // whatever we have: initialCoordinate > already-fetched location > default.
  const handleMapReady = useCallback(() => {
    if (initialCoordinate) {
      cameraRef.current?.setCamera({
        centerCoordinate: initialCoordinate,
        zoomLevel: LOCATED_ZOOM,
        animationDuration: 0,
      })
      return
    }
    if (fetchedCoordRef.current) {
      cameraRef.current?.setCamera({
        centerCoordinate: fetchedCoordRef.current,
        zoomLevel: LOCATED_ZOOM,
        animationDuration: 0,
      })
    }
    // else: map stays at DEFAULT_CENTER / DEFAULT_ZOOM until fetchLocation pans it
  }, [initialCoordinate])

  const handleRegionDidChange = useCallback(
    (region: GeoJSON.Feature<GeoJSON.Point>) => {
      if (region.geometry?.coordinates) {
        centerRef.current = region.geometry.coordinates as [number, number]
      }
    },
    [],
  )

  const handlePublish = () => {
    const [lng, lat] = centerRef.current
    onConfirm(lat, lng, publishToMap, shareAnonymously)
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={handleMapReady}
        onRegionDidChange={handleRegionDidChange}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: DEFAULT_CENTER, zoomLevel: DEFAULT_ZOOM }}
        />
      </MapView>

      <View style={styles.pinWrap} pointerEvents="none">
        <Ionicons name="location-sharp" size={44} color={colors.green} />
      </View>
      <View style={styles.pinShadow} pointerEvents="none" />

      <View style={[styles.header, { paddingTop: insets.top + space[8] }]}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>Pin Location</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={onClose}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
          <Ionicons name="close" size={20} color={colors.card} />
        </Pressable>
      </View>

      {phase === 'map' && locationDenied ? (
        <View
          style={[styles.deniedBanner, { top: insets.top + space[56] }]}
          pointerEvents="none">
          <Text style={styles.deniedText}>
            Location access denied — drag the map to set your pin manually.
          </Text>
        </View>
      ) : null}

      {phase === 'map' ? (
        <View style={styles.hintBubble} pointerEvents="none">
          <Text style={styles.hintText}>Pan to move the pin</Text>
        </View>
      ) : null}

      {phase === 'map' ? (
        <View style={[styles.footer, { paddingBottom: insets.bottom + space[16] }]}>
          <View style={styles.popWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Confirm pin"
              onPress={() => setPhase('share')}
              style={({ pressed }) => [styles.popButton, pressed && styles.popPressed]}>
              <Text style={styles.popLabel}>Confirm Pin</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit without pinning"
            onPress={onClose}
            style={styles.exitBtn}>
            <Text style={styles.exitText}>Exit</Text>
          </Pressable>
        </View>
      ) : null}

      {phase === 'share' ? (
        <ShareCard
          insets={insets}
          publishToMap={publishToMap}
          shareAnonymously={shareAnonymously}
          onTogglePublish={() => setPublishToMap(v => !v)}
          onToggleAnonymous={() => setShareAnonymously(v => !v)}
          onPublish={handlePublish}
          onDismissed={() => setPhase('map')}
        />
      ) : null}
    </View>
  )
}

interface ShareCardProps {
  insets: { bottom: number }
  publishToMap: boolean
  shareAnonymously: boolean
  onTogglePublish: () => void
  onToggleAnonymous: () => void
  onPublish: () => void
  onDismissed: () => void
}

function ShareCard({
  insets,
  publishToMap,
  shareAnonymously,
  onTogglePublish,
  onToggleAnonymous,
  onPublish,
  onDismissed,
}: ShareCardProps) {
  const { height: windowHeight } = useWindowDimensions()
  const offset = useSharedValue(windowHeight)
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }))

  useEffect(() => {
    offset.value = withTiming(0, SHEET_ENTER_TIMING)
  }, [offset, windowHeight])

  const handleDismiss = () => {
    offset.value = withTiming(windowHeight, SHEET_EXIT_TIMING, () => runOnJS(onDismissed)())
  }

  return (
    <ReAnimated.View
      style={[
        styles.shareCard,
        { paddingBottom: insets.bottom + space[16] },
        animStyle,
      ]}>
      <Text style={styles.shareTitle}>Share on Nearby Map</Text>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: publishToMap }}
        accessibilityLabel="Publish to Nearby map"
        onPress={onTogglePublish}
        style={styles.checkRow}>
        <Ionicons
          name={publishToMap ? 'checkbox' : 'square-outline'}
          size={20}
          color={publishToMap ? colors.green : colors.dim}
        />
        <Text style={styles.checkText}>Publish to Nearby map</Text>
      </Pressable>

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: shareAnonymously, disabled: !publishToMap }}
        accessibilityLabel="Share anonymously"
        onPress={() => publishToMap && onToggleAnonymous()}
        style={[styles.checkRow, !publishToMap && styles.checkRowDisabled]}>
        <Ionicons
          name={shareAnonymously ? 'checkbox' : 'square-outline'}
          size={20}
          color={!publishToMap ? colors.hairline : shareAnonymously ? colors.green : colors.dim}
        />
        <Text style={[styles.checkText, !publishToMap && styles.checkTextDisabled]}>
          Share anonymously — uncheck to show your username publicly.
        </Text>
      </Pressable>

      <View style={styles.popWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Publish to Nearby"
          onPress={onPublish}
          style={({ pressed }) => [styles.popButton, pressed && styles.popPressed]}>
          <Text style={styles.popLabel}>Publish to Nearby</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        onPress={handleDismiss}
        style={styles.cancelShareBtn}>
        <Text style={styles.cancelShareText}>Cancel</Text>
      </Pressable>
    </ReAnimated.View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  pinWrap: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -22 }, { translateY: -44 }],
  },
  pinShadow: {
    position: 'absolute',
    width: 10,
    height: 5,
    borderRadius: 5,
    backgroundColor: 'rgba(0,0,0,0.22)',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -5 }, { translateY: -2 }],
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingBottom: space[8],
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(21,33,48,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  headerSpacer: {
    minWidth: 44,
  },
  deniedBanner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(21,33,48,0.72)',
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    maxWidth: '80%',
  },
  deniedText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.card,
    textAlign: 'center',
    lineHeight: 18,
  },
  hintBubble: {
    position: 'absolute',
    top: '50%',
    alignSelf: 'center',
    marginTop: space[16],
    backgroundColor: 'rgba(21,33,48,0.72)',
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
  },
  hintText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    letterSpacing: 0.2,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[16],
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
  popLabel: {
    color: colors.card,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
  },
  exitBtn: {
    alignItems: 'center',
    paddingVertical: space[16],
  },
  exitText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  shareCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...slideUpSheetShell(),
    paddingHorizontal: space[16],
    paddingTop: space[24],
    gap: space[16],
  },
  shareHandle: {
    ...slideUpSheetHandle,
    alignSelf: 'center',
    marginBottom: space[8],
  },
  shareTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
  },
  checkRowDisabled: {
    opacity: 0.45,
  },
  checkText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 20,
  },
  checkTextDisabled: {
    color: colors.dim,
  },
  cancelShareBtn: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
  cancelShareText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
})
