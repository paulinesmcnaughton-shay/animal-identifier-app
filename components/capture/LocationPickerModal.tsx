import { Camera, MapView } from '@rnmapbox/maps'
import { Ionicons } from '@expo/vector-icons'
import * as Location from 'expo-location'
import { useCallback, useRef } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const DEFAULT_CENTER: [number, number] = [-98, 39]
const DEFAULT_ZOOM = 3
const LOCATED_ZOOM = 14

interface LocationPickerModalProps {
  visible: boolean
  initialCoordinate?: [number, number] | null
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
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
  onClose,
  onConfirm,
}: LocationPickerModalProps) {
  const insets = useSafeAreaInsets()
  const mapRef = useRef<MapView>(null)
  const cameraRef = useRef<Camera>(null)
  const centerRef = useRef<[number, number]>(initialCoordinate ?? DEFAULT_CENTER)

  const handleMapReady = useCallback(async () => {
    if (initialCoordinate) {
      cameraRef.current?.setCamera({
        centerCoordinate: initialCoordinate,
        zoomLevel: LOCATED_ZOOM,
        animationDuration: 0,
      })
      return
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        const coord: [number, number] = [pos.coords.longitude, pos.coords.latitude]
        centerRef.current = coord
        cameraRef.current?.setCamera({
          centerCoordinate: coord,
          zoomLevel: LOCATED_ZOOM,
          animationDuration: 600,
        })
      }
    } catch {}
  }, [initialCoordinate])

  const handleRegionDidChange = useCallback(
    (region: GeoJSON.Feature<GeoJSON.Point>) => {
      if (region.geometry?.coordinates) {
        centerRef.current = region.geometry.coordinates as [number, number]
      }
    },
    [],
  )

  const handleConfirm = () => {
    const [lng, lat] = centerRef.current
    onConfirm(lat, lng)
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        logoEnabled={false}
        attributionEnabled={false}
        onDidFinishLoadingMap={() => void handleMapReady()}
        onRegionDidChange={handleRegionDidChange}>
        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: DEFAULT_CENTER, zoomLevel: DEFAULT_ZOOM }}
        />
      </MapView>

      {/* Pin tip fixed at screen center */}
      <View style={styles.pinWrap} pointerEvents="none">
        <Ionicons name="location-sharp" size={44} color={colors.green} />
      </View>
      <View style={styles.pinShadow} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + space[8] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          onPress={onClose}
          style={({ pressed }) => [styles.cancelBtn, pressed && styles.pressed]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Pin Location</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Drag hint */}
      <View style={styles.hintBubble} pointerEvents="none">
        <Text style={styles.hintText}>Pan to move the pin</Text>
      </View>

      {/* Confirm footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + space[16] }]}>
        <View style={styles.popWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Confirm location"
            onPress={handleConfirm}
            style={({ pressed }) => [styles.popButton, pressed && styles.popPressed]}>
            <Text style={styles.popLabel}>Confirm location</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  // Pin tip is positioned so its bottom-center (the point) sits at screen center.
  // Icon is 44×44: translateX(-22) centers horizontally, translateY(-44) moves top
  // of icon to screen center, making the tip land exactly on center.
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
  cancelBtn: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
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
})
