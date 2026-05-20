import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import Mapbox, {
  Camera,
  CircleLayer,
  LineLayer,
  MapView,
  MarkerView,
  ShapeSource,
  VectorSource,
} from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeViewGestureHandler,
} from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomMapPin } from '@/components/map/KingdomMapPin'
import { NearbyRadarRings } from '@/components/map/NearbyRadarRings'
import { UserHeadingBeam } from '@/components/map/UserHeadingBeam'
import { KINGDOM, KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { contentTopInset } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useDeviceHeading } from '@/features/map/use-device-heading'
import { getKingdomPinZoomStyle } from '@/features/map/kingdom-pin-zoom'
import { shiftSightingsNearUser, useUserLocation } from '@/features/map/use-user-location'
import { PAN_ACTIVE_OFFSET_Y, PAN_FAIL_OFFSET_X } from '@/lib/draggable-sheet'

const MAPBOX_TOKEN = (Constants.expoConfig?.extra?.mapboxToken as string) ?? ''
Mapbox.setAccessToken(MAPBOX_TOKEN)

// ─── Mock data ───────────────────────────────────────────────────────────────

interface Sighting {
  id: string
  name: string
  kingdom: KingdomKey
  lat: number
  lng: number
  date: string
  count: number
  isNew?: boolean
}

const MOCK_SIGHTINGS: Sighting[] = [
  { id: '1',  name: 'Red Fox',      kingdom: 'mammal',    lat: 51.5076, lng: -0.0962, date: 'Today',     count: 3 },
  { id: '2',  name: 'Robin',        kingdom: 'bird',      lat: 51.5084, lng: -0.0850, date: 'Yesterday', count: 5 },
  { id: '3',  name: 'Monarch',      kingdom: 'insect',    lat: 51.5043, lng: -0.0813, date: '3d ago',    count: 1, isNew: true },
  { id: '4',  name: 'Badger',       kingdom: 'mammal',    lat: 51.5019, lng: -0.0948, date: '1w ago',    count: 2 },
  { id: '5',  name: 'Blue Jay',     kingdom: 'bird',      lat: 51.5028, lng: -0.0854, date: '2w ago',    count: 4 },
  { id: '6',  name: 'Hare',         kingdom: 'mammal',    lat: 51.5091, lng: -0.0905, date: 'Today',     count: 1 },
  { id: '7',  name: 'Palmate Newt', kingdom: 'amphibian', lat: 51.5058, lng: -0.0985, date: '4d ago',    count: 2, isNew: true },
  { id: '8',  name: 'Tawny Owl',    kingdom: 'bird',      lat: 51.5034, lng: -0.0973, date: '1w ago',    count: 3 },
  { id: '9',  name: 'Common Frog',  kingdom: 'amphibian', lat: 51.5011, lng: -0.0880, date: '2d ago',    count: 6 },
  { id: '10', name: 'Stag Beetle',  kingdom: 'insect',    lat: 51.5064, lng: -0.0833, date: '5d ago',    count: 2, isNew: true },
]

const NEARBY_DISTANCES_M = [120, 280, 350, 490, 620, 850, 1100, 1400] as const
const NEARBY_SIGHTING_INDEX = [0, 6, 1, 9, 3, 7, 4, 2] as const

function formatDist(m: number): string {
  return m < 1000 ? `${m}m away` : `${(m / 1000).toFixed(1)}km away`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const WILDR_MAP_STYLE = 'mapbox://styles/test4backend/cmpd0l12s006v01rv1tgt72g0'
const TERRAIN_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12'
const MAPBOX_STREETS_SOURCE = 'mapbox://mapbox.mapbox-streets-v8'
const GREENSPACE_STROKE = colors.green
const GREENSPACE_STROKE_STYLE = {
  lineColor: GREENSPACE_STROKE,
  lineWidth: 0.5,
  lineOpacity: 0.4,
} as const

const SHEET_HEIGHT = 380
const SHEET_HEADER_HEIGHT = 80
const TAB_BAR_HEIGHT = 60
const FAB_SIZE = 56
const GAP_ABOVE_NAV = 0
const GAP_ABOVE_FAB = space[48]
const SNAP_EXPANDED = 0
const SPRING = { damping: 42, stiffness: 180 }
/** Pin detail body: handle → View in Dex (excludes bottom inset above nav). */
const PIN_PANEL_BODY_HEIGHT = 232

function sheetBottomInset(bottomSafeArea: number): number {
  const fabTopFromBottom = bottomSafeArea + TAB_BAR_HEIGHT - FAB_SIZE / 2
  return fabTopFromBottom + GAP_ABOVE_FAB
}

type ViewMode = 'sightings' | 'nearby'

export function MapScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapView>(null)
  const mapNativeGestureRef = useRef<NativeViewGestureHandler>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('sightings')
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null)
  const [mapStyle, setMapStyle] = useState<'light' | 'terrain'>('light')
  const [zoom, setZoom] = useState(13)
  const [mapBearing, setMapBearing] = useState(0)
  const { heading: deviceHeading, isAvailable: hasHeading } = useDeviceHeading()
  const { coordinate: userCoord, isLive: hasLiveLocation } = useUserLocation()
  const hasCenteredOnUser = useRef(false)

  const sightingsOnMap = useMemo(
    () => (hasLiveLocation ? shiftSightingsNearUser(MOCK_SIGHTINGS, userCoord) : MOCK_SIGHTINGS),
    [hasLiveLocation, userCoord],
  )

  const nearbyList = useMemo(
    () =>
      NEARBY_SIGHTING_INDEX.map((index, i) => ({
        ...sightingsOnMap[index],
        distanceM: NEARBY_DISTANCES_M[i],
      })),
    [sightingsOnMap],
  )

  const pinZoomStyle = useMemo(() => getKingdomPinZoomStyle(zoom), [zoom])

  useEffect(() => {
    if (!hasLiveLocation || hasCenteredOnUser.current) return
    hasCenteredOnUser.current = true
    cameraRef.current?.setCamera({
      centerCoordinate: userCoord,
      zoomLevel: 15,
      animationDuration: 800,
    })
  }, [hasLiveLocation, userCoord])

  // Prevents the MapView onPress from firing immediately after a pin tap
  const pinJustTappedRef = useRef(false)

  const tabBarClearance = insets.bottom + TAB_BAR_HEIGHT + space[16]
  const snapCollapsed = SHEET_HEIGHT - (tabBarClearance + GAP_ABOVE_NAV + SHEET_HEADER_HEIGHT)
  const fabClearance = sheetBottomInset(insets.bottom)
  const snapExpandedPin = Math.max(
    SNAP_EXPANDED,
    SHEET_HEIGHT - PIN_PANEL_BODY_HEIGHT - fabClearance,
  )
  const snapExpandedY = viewMode === 'nearby' ? SNAP_EXPANDED : snapExpandedPin

  const translateY = useSharedValue(snapCollapsed)
  const context = useSharedValue(0)

  /** My Sightings is header-only until a pin is tapped; Nearby list can always expand. */
  const sheetExpandable = viewMode === 'nearby' || selectedSighting !== null

  useEffect(() => {
    if (!sheetExpandable) {
      translateY.value = withSpring(snapCollapsed, SPRING)
    }
  }, [sheetExpandable, snapCollapsed, translateY])

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(sheetExpandable)
        .activeOffsetY([-PAN_ACTIVE_OFFSET_Y, PAN_ACTIVE_OFFSET_Y])
        .failOffsetX([...PAN_FAIL_OFFSET_X])
        .onStart(() => {
          context.value = translateY.value
        })
        .onUpdate((e) => {
          translateY.value = Math.max(
            snapExpandedY,
            Math.min(snapCollapsed, context.value + e.translationY),
          )
        })
        .onEnd((e) => {
          const mid = (snapCollapsed + snapExpandedY) / 2
          if (e.velocityY < -500 || translateY.value < mid) {
            translateY.value = withSpring(snapExpandedY, SPRING)
          } else {
            translateY.value = withSpring(snapCollapsed, SPRING)
          }
        }),
    [context, sheetExpandable, snapCollapsed, snapExpandedY, translateY],
  )

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const handleMarkerPress = (sighting: Sighting) => {
    pinJustTappedRef.current = true
    setSelectedSighting(sighting)
    translateY.value = withSpring(snapExpandedPin, SPRING)
  }

  const handleMapPress = () => {
    // A pin tap always co-fires a map tap — consume the flag and do nothing.
    // Only a bare map tap (no pin) reaches the clear logic.
    if (pinJustTappedRef.current) {
      pinJustTappedRef.current = false
      return
    }
    setSelectedSighting(null)
    translateY.value = withSpring(snapCollapsed, SPRING)
  }

  const handleZoomIn = async () => {
    const zoom = await mapRef.current?.getZoom()
    if (zoom === undefined) return
    cameraRef.current?.setCamera({ zoomLevel: Math.min(22, zoom + 1), animationDuration: 250 })
  }

  const handleZoomOut = async () => {
    const zoom = await mapRef.current?.getZoom()
    if (zoom === undefined) return
    cameraRef.current?.setCamera({ zoomLevel: Math.max(1, zoom - 1), animationDuration: 250 })
  }

  const handleLocateMe = () => {
    cameraRef.current?.setCamera({
      centerCoordinate: userCoord,
      zoomLevel: 15,
      animationDuration: 600,
    })
  }

  const handleToggleStyle = () => {
    setMapStyle((s) => s === 'light' ? 'terrain' : 'light')
  }

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode)
    if (mode === 'sightings') {
      setSelectedSighting(null)
      translateY.value = withSpring(snapCollapsed, SPRING)
    }
  }

  const handleViewInDex = () => {
    router.push('/(tabs)/dex' as never)
  }

  const handleMapRegionUpdate = useCallback(
    (feature: { properties: { zoomLevel: number; heading?: number } }) => {
      setZoom(feature.properties.zoomLevel)
      const heading = feature.properties.heading
      if (typeof heading === 'number' && Number.isFinite(heading)) {
        setMapBearing(heading)
      }
    },
    [],
  )

  return (
    <View style={styles.root}>
      <NativeViewGestureHandler
        ref={mapNativeGestureRef}
        style={StyleSheet.absoluteFill}
        disallowInterruption>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          styleURL={mapStyle === 'light' ? WILDR_MAP_STYLE : TERRAIN_MAP_STYLE}
          scrollEnabled
          zoomEnabled
          pitchEnabled={false}
          rotateEnabled
          requestDisallowInterceptTouchEvent
          gestureSettings={{
            pinchZoomEnabled: true,
            pinchPanEnabled: true,
            panEnabled: true,
            rotateEnabled: true,
          }}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onPress={handleMapPress}
          onRegionIsChanging={handleMapRegionUpdate}
          onRegionDidChange={handleMapRegionUpdate}
          onMapLoadingError={() => console.warn('MapLoadError: check token and network')}>

          <Camera
            ref={cameraRef}
            defaultSettings={{ centerCoordinate: userCoord, zoomLevel: 13 }}
          />

          <VectorSource id="wildr-greenspace-strokes" url={MAPBOX_STREETS_SOURCE}>
            <LineLayer
              id="wildr-greenspace-landcover-stroke"
              sourceLayerID="landcover"
              filter={[
                'match',
                ['get', 'class'],
                ['grass', 'wood', 'scrub', 'crop'],
                true,
                false,
              ]}
              style={GREENSPACE_STROKE_STYLE}
              minZoomLevel={10}
            />
            <LineLayer
              id="wildr-greenspace-landuse-stroke"
              sourceLayerID="landuse"
              filter={[
                'match',
                ['get', 'class'],
                ['park', 'grass', 'scrub', 'cemetery', 'golf_course', 'pitch'],
                true,
                false,
              ]}
              style={GREENSPACE_STROKE_STYLE}
              minZoomLevel={10}
            />
            <LineLayer
              id="wildr-greenspace-park-stroke"
              sourceLayerID="landuse_overlay"
              filter={['==', ['get', 'class'], 'national_park']}
              style={GREENSPACE_STROKE_STYLE}
              minZoomLevel={6}
            />
          </VectorSource>

          {viewMode === 'nearby' && (
            <MarkerView coordinate={userCoord} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
              <NearbyRadarRings />
            </MarkerView>
          )}

          <MarkerView coordinate={userCoord} anchor={{ x: 0.5, y: 0.5 }} allowOverlap isSelected>
            <UserLocationMarker
              deviceHeading={deviceHeading}
              mapBearing={mapBearing}
              showHeadingBeam={hasHeading}
            />
          </MarkerView>

          {pinZoomStyle.size > 0 &&
            sightingsOnMap.map((s) => (
              <MarkerView
                key={s.id}
                coordinate={[s.lng, s.lat]}
                anchor={{ x: 0.5, y: 0.5 }}
                allowOverlap>
                <Pressable
                  onPress={() => handleMarkerPress(s)}
                  accessibilityRole="button"
                  accessibilityLabel={s.name}>
                  <KingdomMapPin kingdom={s.kingdom} zoomStyle={pinZoomStyle} />
                </Pressable>
              </MarkerView>
            ))}

        </MapView>
      </NativeViewGestureHandler>

      {/* ── Top overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: contentTopInset(insets.top) }]}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={colors.dim} />
          <TextInput
            placeholder="Search species or places…"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
          />
        </View>

        <View style={styles.togglePill}>
          <Pressable
            onPress={() => handleToggleView('sightings')}
            style={[styles.toggleOption, viewMode === 'sightings' && styles.toggleActive]}>
            <Text style={[styles.toggleLabel, viewMode === 'sightings' && styles.toggleLabelActive]}>
              My Sightings
            </Text>
          </Pressable>
          <Pressable
            onPress={() => handleToggleView('nearby')}
            style={[styles.toggleOption, viewMode === 'nearby' && styles.toggleActive]}>
            <Text style={[styles.toggleLabel, viewMode === 'nearby' && styles.toggleLabelActive]}>
              Nearby
            </Text>
          </Pressable>
        </View>
      </View>

      {/* ── Side buttons ── */}
      <View style={[styles.sideButtons, { top: insets.top + 148 }]}>
        <Pressable
          onPress={handleLocateMe}
          accessibilityRole="button"
          accessibilityLabel="Locate me"
          style={styles.sideBtn}>
          <Ionicons name="locate" size={20} color={colors.ink2} />
        </Pressable>
        <Pressable
          onPress={handleToggleStyle}
          accessibilityRole="button"
          accessibilityLabel="Toggle layer"
          style={[styles.sideBtn, mapStyle === 'terrain' && styles.sideBtnActive]}>
          <Ionicons name="layers-outline" size={20} color={mapStyle === 'terrain' ? colors.card : colors.ink2} />
        </Pressable>
        <Pressable
          onPress={handleZoomIn}
          accessibilityRole="button"
          accessibilityLabel="Zoom in"
          style={styles.sideBtn}>
          <Ionicons name="add" size={20} color={colors.ink2} />
        </Pressable>
        <Pressable
          onPress={handleZoomOut}
          accessibilityRole="button"
          accessibilityLabel="Zoom out"
          style={styles.sideBtn}>
          <Ionicons name="remove" size={20} color={colors.ink2} />
        </Pressable>
      </View>

      {/* ── Bottom sheet ── */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[styles.bottomSheet, { paddingBottom: tabBarClearance }, sheetStyle]}>
          {viewMode === 'sightings'
            ? (
                <SightingsSheet
                  selectedSighting={selectedSighting}
                  onViewInDex={handleViewInDex}
                  areaLabel={hasLiveLocation ? 'Around you' : 'Hyde Park Area'}
                />
              )
            : <NearbySheet items={nearbyList} />
          }
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SheetProps {
  selectedSighting: Sighting | null
  onViewInDex: () => void
  areaLabel: string
}

function SightingsSheet({ selectedSighting, onViewInDex, areaLabel }: SheetProps) {
  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>{areaLabel}</Text>
          <Text style={styles.sheetSub}>47 species · 128 sightings</Text>
        </View>
        <View style={styles.statChip}>
          <Ionicons name="trending-up" size={13} color={colors.green} />
          <Text style={styles.statChipText}>+3 this week</Text>
        </View>
      </View>
      {selectedSighting && <PinDetail sighting={selectedSighting} onViewInDex={onViewInDex} />}
    </View>
  )
}

interface NearbySheetProps {
  items: (Sighting & { distanceM: number })[]
}

function NearbySheet({ items }: NearbySheetProps) {
  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <Text style={styles.sheetTitle}>Nearby Species</Text>
      <Text style={[styles.sheetSub, { marginBottom: space[16] }]}>Within 2km of you</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        scrollEnabled
        style={styles.nearbyList}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <View style={styles.nearbyRow}>
            <View style={styles.nearbyMeta}>
              <View style={styles.nearbyNameRow}>
                <Text style={styles.nearbyName}>{item.name}</Text>
                {item.isNew && (
                  <View style={styles.newTag}>
                    <Text style={styles.newTagText}>NEW</Text>
                  </View>
                )}
              </View>
              <Text style={styles.nearbyDist}>{formatDist(item.distanceM)}</Text>
            </View>
            <KingdomBadge kind={item.kingdom} />
          </View>
        )}
      />
    </View>
  )
}

function PinDetail({ sighting, onViewInDex }: { sighting: Sighting; onViewInDex: () => void }) {
  return (
    <>
      <View style={styles.pinDivider} />
      <View style={styles.pinDetailHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.pinDetailName}>{sighting.name}</Text>
          <Text style={styles.pinDetailMeta}>
            Spotted {sighting.date} · {sighting.count} {sighting.count === 1 ? 'sighting' : 'sightings'}
          </Text>
        </View>
        <KingdomBadge kind={sighting.kingdom} />
      </View>
      <View style={styles.btnShadow}>
        <Pressable
          onPress={onViewInDex}
          accessibilityRole="button"
          accessibilityLabel="View in Dex"
          style={({ pressed }) => [styles.btnInner, pressed && styles.btnPressed]}>
          <Text style={styles.btnText}>View in Dex</Text>
        </Pressable>
      </View>
    </>
  )
}

// ─── User location marker ────────────────────────────────────────────────────

interface UserLocationMarkerProps {
  deviceHeading: number | null
  mapBearing: number
  showHeadingBeam: boolean
}

function UserLocationMarker({ deviceHeading, mapBearing, showHeadingBeam }: UserLocationMarkerProps) {
  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0.9)

  useEffect(() => {
    scale.value = withRepeat(withTiming(3, { duration: 2200 }), -1, false)
    opacity.value = withRepeat(withTiming(0, { duration: 2200 }), -1, false)
  }, [opacity, scale])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  const beamRotation = useSharedValue(0)

  useEffect(() => {
    if (deviceHeading === null) return
    const next = ((deviceHeading - mapBearing) % 360 + 360) % 360
    beamRotation.value = withTiming(next, { duration: 120 })
  }, [beamRotation, deviceHeading, mapBearing])

  const beamStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${beamRotation.value}deg` }],
  }))

  return (
    <View style={userStyles.wrap}>
      {showHeadingBeam && deviceHeading !== null ? (
        <Animated.View style={[userStyles.beamWrap, beamStyle]} pointerEvents="none">
          <UserHeadingBeam />
        </Animated.View>
      ) : null}
      <Animated.View style={[userStyles.ring, ringStyle]} />
      <View style={userStyles.dot}>
        <View style={userStyles.dotCore} />
      </View>
    </View>
  )
}

const USER_DOT = 22

const userStyles = StyleSheet.create({
  wrap: {
    width: 112,
    height: 112,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beamWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: USER_DOT / 2,
    backgroundColor: `${colors.mapUser}30`,
    borderWidth: 1.5,
    borderColor: `${colors.mapUser}70`,
  },
  dot: {
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: USER_DOT / 2,
    backgroundColor: colors.mapUser,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.mapUser,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 5,
  },
  dotCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.card,
  },
})

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // Top overlay
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[16],
    gap: space[8],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    ...shadow.card,
  },
  searchInput: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
    padding: 0,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: space[4],
    alignSelf: 'center',
    ...shadow.card,
  },
  toggleOption: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  toggleActive: {
    backgroundColor: colors.green,
  },
  toggleLabel: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  toggleLabelActive: {
    color: colors.card,
  },

  // Side buttons
  sideButtons: {
    position: 'absolute',
    right: space[16],
    gap: space[8],
  },
  sideBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  sideBtnActive: {
    backgroundColor: colors.green,
  },

  // Bottom sheet
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    ...slideUpSheetShell(),
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: space[16],
    paddingTop: space[16],
  },
  handle: {
    ...slideUpSheetHandle,
    marginBottom: space[16],
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
  },
  sheetTitle: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  sheetSub: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    marginTop: space[4],
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: `${colors.green}18`,
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  statChipText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },

  // Pin detail content (appended below area header)
  pinDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: space[16],
  },
  pinDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    marginBottom: space[16],
  },
  pinDetailName: {
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
    marginBottom: space[4],
  },
  pinDetailMeta: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },

  // Duolingo bottom-shadow CTA
  btnShadow: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.sm,
    paddingBottom: 4,
  },
  btnInner: {
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: space[16],
    alignItems: 'center',
    transform: [{ translateY: 0 }],
  },
  btnPressed: {
    transform: [{ translateY: 2 }],
  },
  btnText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
    letterSpacing: 0.3,
  },

  // Nearby list
  nearbyList: {
    flex: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: space[8],
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  nearbyMeta: {
    flex: 1,
  },
  nearbyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  nearbyName: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  nearbyDist: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    marginTop: space[4],
  },
  newTag: {
    backgroundColor: `${colors.sun}30`,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  newTagText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.earth,
    letterSpacing: 0.5,
  },
})
