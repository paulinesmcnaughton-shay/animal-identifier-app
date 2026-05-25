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
import * as Location from 'expo-location'
import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native'
import {
  Gesture,
  GestureDetector,
  NativeViewGestureHandler,
} from 'react-native-gesture-handler'
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomMapPin } from '@/components/map/KingdomMapPin'
import { LocationAccessBanner } from '@/components/map/LocationAccessBanner'
import { WalkDirectionsNav } from '@/components/map/WalkDirectionsNav'
import { WalkDirectionsPreview } from '@/components/map/WalkDirectionsPreview'
import { NearbySpotDetailCard } from '@/components/map/NearbySpotDetailCard'
import { NearbySpeciesName } from '@/components/map/NearbySpeciesName'
import { VerifiedIcon } from '@/components/map/VerifiedIcon'
import { NearbyRadarRings } from '@/components/map/NearbyRadarRings'
import { UserHeadingBeam } from '@/components/map/UserHeadingBeam'
import { KINGDOM, KingdomBadge } from '@/design/atoms/KingdomBadge'
import { slideUpSheetHandle, slideUpSheetRadius } from '@/design/slide-up-sheet'
import { contentTopInset } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useDeviceHeading } from '@/features/map/use-device-heading'
import { getKingdomPinZoomStyle } from '@/features/map/kingdom-pin-zoom'
import { arrowRotationDegrees, bearingDegrees, liveGuideDistanceM } from '@/features/map/map-guide-math'
import { haversineDistanceM } from '@/features/map/geo'
import {
  createMapGuideTarget,
  fitMapGuideCamera,
  fitMapGuideCameraToRoute,
  type WalkGuideSession,
} from '@/features/map/map-guide'
import {
  applyWalkNavigationCamera,
  resolveWalkNavHeading,
  walkNavCameraPadding,
  walkNavLookAheadCoordinate,
} from '@/features/map/walk-navigation-camera'
import { useWalkingGuide } from '@/features/map/use-walking-guide'
import {
  type DistanceUnit,
  formatDistance,
  nearbySearchEmptyMessage,
} from '@/features/settings/distance-unit'
import { useDistanceUnit } from '@/features/settings/use-distance-unit'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'
import { useAuth } from '@/lib/auth/auth-context'
import {
  isWithinNearbyRadius,
  NEARBY_PRIORITY_MILES,
} from '@/features/map/nearby-radius'
import { useNearbyCommunitySightings } from '@/features/map/use-nearby-community'
import { useUserLocation, type MapCoordinate } from '@/features/map/use-user-location'
import { useAccountProfile } from '@/features/settings/account-profile'
import {
  MAP_SHEET_HEIGHT_DEFAULT,
  mapExpandedSheetTopY,
} from '@/features/map/map-sheet-layout'
import { PAN_ACTIVE_OFFSET_Y, PAN_FAIL_OFFSET_X } from '@/lib/draggable-sheet'

const MAPBOX_TOKEN = (Constants.expoConfig?.extra?.mapboxToken as string) ?? ''
Mapbox.setAccessToken(MAPBOX_TOKEN)

// ─── Screen ───────────────────────────────────────────────────────────────────

const WILDKIND_MAP_STYLE = 'mapbox://styles/test4backend/cmpd0l12s006v01rv1tgt72g0'
const TERRAIN_MAP_STYLE = 'mapbox://styles/mapbox/outdoors-v12'
const MAPBOX_STREETS_SOURCE = 'mapbox://mapbox.mapbox-streets-v8'
const GREENSPACE_STROKE = colors.green
const GREENSPACE_STROKE_STYLE = {
  lineColor: GREENSPACE_STROKE,
  lineWidth: 0.5,
  lineOpacity: 0.4,
} as const

const SHEET_HEADER_HEIGHT = 80
/** Extra collapsed peek so My Sightings copy clears the center camera FAB */
const SHEET_FAB_CLEARANCE_PEEK = space[16]
const TAB_BAR_HEIGHT = 60
const FAB_SIZE = 56
const GAP_ABOVE_NAV = 0
const GAP_ABOVE_FAB = space[48]
const SNAP_EXPANDED = 0
/** Default walk preview sheet height — shows header, summary, and direction steps above the footer CTAs. */
const WALK_PREVIEW_DEFAULT_HEIGHT = 520
const WALK_PREVIEW_ACTION_HEIGHT = 52
const SPRING = { damping: 42, stiffness: 180 }
/** Pin detail on My Sightings (legacy sheet height when not using full detail). */
const PIN_PANEL_BODY_HEIGHT = 232

function sheetBottomInset(bottomSafeArea: number): number {
  const fabTopFromBottom = bottomSafeArea + TAB_BAR_HEIGHT - FAB_SIZE / 2
  return fabTopFromBottom + GAP_ABOVE_FAB
}

type ViewMode = 'sightings' | 'nearby'

export function MapScreenContent() {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapView>(null)
  const mapNativeGestureRef = useRef<NativeViewGestureHandler>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('sightings')
  const [selectedSighting, setSelectedSighting] = useState<NearbyMapSighting | null>(null)
  const [walkSession, setWalkSession] = useState<WalkGuideSession | null>(null)
  const [mapStyle, setMapStyle] = useState<'light' | 'terrain'>('light')
  const [zoom, setZoom] = useState(13)
  const [mapBearing, setMapBearing] = useState(0)
  const { heading: deviceHeading, isAvailable: hasHeading } = useDeviceHeading()
  const {
    coordinate: userCoord,
    isLive: hasLiveLocation,
    isLoading: locationLoading,
    permissionDenied: locationDenied,
    refreshLocation,
  } = useUserLocation()
  const { isAuthenticated } = useAuth()
  const { spotsCaptured } = useAccountProfile()
  const { mapPins } = useUserSightingsData()
  const distanceUnit = useDistanceUnit()
  const mapCenteredRef = useRef<'none' | 'cached' | 'live'>('none')

  const {
    items: nearbyCommunity,
    isLoading: nearbyLoading,
    error: nearbyError,
  } = useNearbyCommunitySightings(userCoord, userCoord !== null)

  useFocusEffect(
    useCallback(() => {
      void refreshLocation()
    }, [refreshLocation]),
  )

  const mySightingsNearby = useMemo(() => {
    if (!isAuthenticated || spotsCaptured === 0 || !hasLiveLocation) return []
    return mapPins.filter((pin) => isWithinNearbyRadius(pin.distanceM))
  }, [hasLiveLocation, isAuthenticated, mapPins, spotsCaptured])

  const pinsOnMap = viewMode === 'nearby' ? nearbyCommunity : mySightingsNearby

  const pinZoomStyle = useMemo(() => getKingdomPinZoomStyle(zoom), [zoom])

  const walkTarget = walkSession?.target ?? null
  const isWalkPreview = walkSession?.phase === 'preview'
  const isWalkNavigating = walkSession?.phase === 'navigating'
  const isWalkActive = walkSession !== null

  const previewCameraPadding = useMemo(
    (): [number, number, number, number] => [
      contentTopInset(insets.top) + 100,
      40,
      280 + insets.bottom,
      40,
    ],
    [insets.bottom, insets.top],
  )

  const walkNavPadding = useMemo(
    () => walkNavCameraPadding(insets.top, insets.bottom),
    [insets.bottom, insets.top],
  )

  const [isFollowingWalkNav, setIsFollowingWalkNav] = useState(true)
  const lastWalkNavCameraRef = useRef({ at: 0, lng: 0, lat: 0 })

  const {
    isRouteLoading,
    routeFailed,
    routeSummary,
    routeSteps,
    metrics: walkGuideMetrics,
  } = useWalkingGuide(
    walkTarget,
    userCoord,
    deviceHeading,
    MAPBOX_TOKEN,
  )

  const guideDisplay = useMemo(() => {
    if (!walkTarget || userCoord === null) return null
    if (walkGuideMetrics) return walkGuideMetrics

    const dest = walkTarget.sighting
    const distanceM = liveGuideDistanceM(userCoord, dest)
    const bearing = bearingDegrees(userCoord, dest)
    return {
      distanceM,
      arrowRotationDeg: arrowRotationDegrees(bearing, deviceHeading),
      instruction: isRouteLoading ? 'Finding a walking path…' : 'Head toward the pin',
      maneuverModifier: null,
      maneuverType: 'depart',
      durationRemainingSec: Math.round(distanceM / 1.4),
      lineFeature: {
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'LineString' as const,
          coordinates: [userCoord, [dest.lng, dest.lat]],
        },
      },
      isWalkingRoute: false,
      routeCoordinates: [userCoord, [dest.lng, dest.lat]] as MapCoordinate[],
    }
  }, [deviceHeading, isRouteLoading, walkTarget, userCoord, walkGuideMetrics])

  const mapCameraCenter = userCoord ?? [-98, 39]
  const mapCameraZoom = userCoord ? 13 : 4

  const activeMapStyleUrl = useMemo(() => {
    if (walkTarget?.venueStyleUrl) return walkTarget.venueStyleUrl
    return mapStyle === 'light' ? WILDKIND_MAP_STYLE : TERRAIN_MAP_STYLE
  }, [walkTarget, mapStyle])

  useEffect(() => {
    if (userCoord === null) return
    const tier = hasLiveLocation ? 'live' : 'cached'
    if (mapCenteredRef.current === 'live') return
    if (mapCenteredRef.current === 'cached' && tier === 'cached') return
    mapCenteredRef.current = tier
    cameraRef.current?.setCamera({
      centerCoordinate: userCoord,
      zoomLevel: 15,
      animationDuration: tier === 'live' ? 800 : 0,
    })
  }, [hasLiveLocation, userCoord])

  // Prevents the MapView onPress from firing immediately after a pin tap
  const pinJustTappedRef = useRef(false)

  const mapSheetTopY = mapExpandedSheetTopY(insets.top)

  const sheetUsesExpandedTopAnchor =
    isWalkPreview || selectedSighting !== null

  const sheetHeight = useMemo(() => {
    if (sheetUsesExpandedTopAnchor) {
      return Math.max(
        MAP_SHEET_HEIGHT_DEFAULT,
        windowHeight - mapSheetTopY,
      )
    }
    return MAP_SHEET_HEIGHT_DEFAULT
  }, [mapSheetTopY, sheetUsesExpandedTopAnchor, windowHeight])

  const tabBarClearance = insets.bottom + TAB_BAR_HEIGHT + space[16]
  const walkPreviewFooterInset =
    space[16] + WALK_PREVIEW_ACTION_HEIGHT + tabBarClearance + FAB_SIZE / 2
  const snapCollapsed =
    sheetHeight - (tabBarClearance + GAP_ABOVE_NAV + SHEET_HEADER_HEIGHT + SHEET_FAB_CLEARANCE_PEEK)
  const snapWalkPreview = Math.max(SNAP_EXPANDED, sheetHeight - WALK_PREVIEW_DEFAULT_HEIGHT)
  const fabClearance = sheetBottomInset(insets.bottom)
  const snapExpandedPin = Math.max(
    SNAP_EXPANDED,
    sheetHeight - PIN_PANEL_BODY_HEIGHT - fabClearance,
  )
  const snapExpandedY =
    isWalkPreview || viewMode === 'nearby' || selectedSighting !== null
      ? SNAP_EXPANDED
      : snapCollapsed

  const translateY = useSharedValue(snapCollapsed)
  const context = useSharedValue(0)
  const selectedSightingRef = useRef(selectedSighting)
  selectedSightingRef.current = selectedSighting

  const dismissSheetDetail = useCallback(() => {
    setSelectedSighting(null)
    setWalkSession(null)
  }, [])

  /** Nearby list expands freely; My Sightings is a header peek until a pin is opened. */
  const sheetExpandable =
    isWalkPreview || (!isWalkNavigating && (viewMode === 'nearby' || selectedSighting !== null))

  const walkSessionRef = useRef(walkSession)
  walkSessionRef.current = walkSession

  const sheetSnapY = useMemo((): number => {
    if (isWalkPreview) return snapWalkPreview
    if (isWalkNavigating) return snapCollapsed
    if (viewMode === 'nearby') return SNAP_EXPANDED
    if (selectedSighting !== null) return SNAP_EXPANDED
    return snapCollapsed
  }, [isWalkNavigating, isWalkPreview, selectedSighting, snapCollapsed, snapWalkPreview, viewMode])

  useEffect(() => {
    translateY.value = withSpring(sheetSnapY, SPRING)
  }, [sheetSnapY, translateY])

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
            return
          }
          if (walkSessionRef.current?.phase === 'preview') {
            translateY.value = withSpring(snapWalkPreview, SPRING)
            return
          }
          if (selectedSightingRef.current !== null) {
            runOnJS(dismissSheetDetail)()
            return
          }
          translateY.value = withSpring(snapCollapsed, SPRING)
        }),
    [context, dismissSheetDetail, sheetExpandable, snapCollapsed, snapExpandedY, snapWalkPreview, translateY],
  )

  const handleClearSheetSelection = useCallback(() => {
    setSelectedSighting(null)
  }, [])

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const handleSelectMapSighting = useCallback((sighting: NearbyMapSighting) => {
    pinJustTappedRef.current = true
    setWalkSession(null)
    setSelectedSighting(sighting)
    cameraRef.current?.setCamera({
      centerCoordinate: [sighting.lng, sighting.lat],
      zoomLevel: 15,
      animationDuration: 600,
    })
  }, [])

  const handleMarkerPress = (sighting: NearbyMapSighting) => {
    handleSelectMapSighting(sighting)
  }

  const handleEndWalkGuide = useCallback(() => {
    setWalkSession(null)
    setIsFollowingWalkNav(true)
    if (userCoord !== null) {
      cameraRef.current?.setCamera({
        centerCoordinate: userCoord,
        zoomLevel: 15,
        heading: 0,
        animationDuration: 500,
      })
    }
  }, [userCoord])

  const focusWalkNavigationCamera = useCallback(
    (animationDurationMs = 350) => {
      if (userCoord === null) return

      const routeCoords = walkGuideMetrics?.routeCoordinates ?? []
      const lookAhead =
        routeCoords.length > 0
          ? walkNavLookAheadCoordinate(userCoord, routeCoords)
          : walkTarget
            ? ([walkTarget.sighting.lng, walkTarget.sighting.lat] as MapCoordinate)
            : null

      const heading = resolveWalkNavHeading(deviceHeading, userCoord, lookAhead)

      applyWalkNavigationCamera({
        cameraRef,
        user: userCoord,
        padding: walkNavPadding,
        heading,
        animationDurationMs,
      })
      lastWalkNavCameraRef.current = {
        at: Date.now(),
        lng: userCoord[0],
        lat: userCoord[1],
      }
    },
    [deviceHeading, userCoord, walkGuideMetrics, walkNavPadding, walkTarget],
  )

  const focusWalkNavigationCameraRef = useRef(focusWalkNavigationCamera)
  focusWalkNavigationCameraRef.current = focusWalkNavigationCamera

  const handleRefitWalkRoute = useCallback(() => {
    if (!walkTarget || userCoord === null) return
    if (isWalkNavigating) {
      setIsFollowingWalkNav(true)
      focusWalkNavigationCamera(500)
      return
    }
    const padding = previewCameraPadding
    if (walkGuideMetrics?.routeCoordinates.length) {
      fitMapGuideCameraToRoute({
        cameraRef,
        coordinates: walkGuideMetrics.routeCoordinates,
        padding,
      })
      return
    }
    fitMapGuideCamera({
      cameraRef,
      user: userCoord,
      destination: walkTarget.sighting,
      hasLiveUser: hasLiveLocation,
      padding,
    })
  }, [
    focusWalkNavigationCamera,
    hasLiveLocation,
    isWalkNavigating,
    previewCameraPadding,
    userCoord,
    walkGuideMetrics,
    walkTarget,
  ])

  useEffect(() => {
    if (!isWalkPreview || !walkGuideMetrics?.routeCoordinates.length) return
    fitMapGuideCameraToRoute({
      cameraRef,
      coordinates: walkGuideMetrics.routeCoordinates,
      padding: previewCameraPadding,
    })
  }, [isWalkPreview, previewCameraPadding, walkGuideMetrics?.routeCoordinates])

  const handleOpenWalkPreview = useCallback(
    (sighting: NearbyMapSighting) => {
      if (userCoord === null) return
      if (!isWithinNearbyRadius(sighting.distanceM)) return
      setWalkSession({ target: createMapGuideTarget(sighting), phase: 'preview' })
      setSelectedSighting(null)
    },
    [userCoord],
  )

  const handleStartWalkNavigation = useCallback(() => {
    setIsFollowingWalkNav(true)
    setWalkSession((prev) => {
      if (!prev) return null
      return { ...prev, phase: 'navigating' }
    })
  }, [])

  useEffect(() => {
    if (!isWalkNavigating) return
    lastWalkNavCameraRef.current = { at: 0, lng: 0, lat: 0 }
    focusWalkNavigationCameraRef.current(600)
  }, [isWalkNavigating])

  useEffect(() => {
    if (!isWalkNavigating || userCoord === null || !isFollowingWalkNav) return

    const [lng, lat] = userCoord
    const prev = lastWalkNavCameraRef.current
    const movedM = haversineDistanceM([prev.lng, prev.lat], { lat, lng })
    const elapsedMs = Date.now() - prev.at
    if (elapsedMs < 350 && movedM < 6) return

    focusWalkNavigationCamera(elapsedMs < 800 ? 400 : 250)
  }, [
    deviceHeading,
    focusWalkNavigationCamera,
    isFollowingWalkNav,
    isWalkNavigating,
    userCoord,
    walkGuideMetrics?.routeCoordinates,
  ])

  const handleMapPress = () => {
    if (pinJustTappedRef.current) {
      pinJustTappedRef.current = false
      return
    }
    if (isWalkNavigating) return
    if (isWalkPreview) return
    setSelectedSighting(null)
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
    if (userCoord === null) return
    if (isWalkNavigating) {
      setIsFollowingWalkNav(true)
      focusWalkNavigationCamera(600)
      return
    }
    cameraRef.current?.setCamera({
      centerCoordinate: userCoord,
      zoomLevel: 15,
      animationDuration: 600,
    })
  }

  const handleEnableLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      await refreshLocation()
      return
    }
    void Linking.openSettings()
  }, [refreshLocation])

  const handleToggleStyle = () => {
    setMapStyle((s) => s === 'light' ? 'terrain' : 'light')
  }

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode)
    setSelectedSighting(null)
    setWalkSession(null)
  }

  const handleMapRegionUpdate = useCallback(
    (feature: {
      properties: {
        zoomLevel: number
        heading?: number
        isGestureActive?: boolean
      }
    }) => {
      setZoom(feature.properties.zoomLevel)
      const heading = feature.properties.heading
      if (typeof heading === 'number' && Number.isFinite(heading)) {
        setMapBearing(heading)
      }
      if (isWalkNavigating && feature.properties.isGestureActive) {
        setIsFollowingWalkNav(false)
      }
    },
    [isWalkNavigating],
  )

  return (
    <View style={styles.root}>
      <NativeViewGestureHandler ref={mapNativeGestureRef} disallowInterruption>
        <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          styleURL={activeMapStyleUrl}
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
            defaultSettings={{ centerCoordinate: mapCameraCenter, zoomLevel: mapCameraZoom }}
          />

          <VectorSource id="wildkind-greenspace-strokes" url={MAPBOX_STREETS_SOURCE}>
            <LineLayer
              id="wildkind-greenspace-landcover-stroke"
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
              id="wildkind-greenspace-landuse-stroke"
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
              id="wildkind-greenspace-park-stroke"
              sourceLayerID="landuse_overlay"
              filter={['==', ['get', 'class'], 'national_park']}
              style={GREENSPACE_STROKE_STYLE}
              minZoomLevel={6}
            />
          </VectorSource>

          {guideDisplay ? (
            <ShapeSource id="map-guide-route" shape={guideDisplay.lineFeature}>
              <LineLayer
                id="map-guide-route-casing"
                style={{
                  lineColor: colors.card,
                  lineWidth: 9,
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
              <LineLayer
                id="map-guide-route-walk"
                style={{
                  lineColor: colors.greenLight,
                  lineWidth: isWalkNavigating ? 7 : 5,
                  lineDasharray: isWalkNavigating ? [0, 1.4] : [0.25, 1.75],
                  lineCap: 'round',
                  lineJoin: 'round',
                }}
              />
            </ShapeSource>
          ) : null}

          {userCoord !== null && (viewMode === 'nearby' || isWalkPreview) ? (
            <MarkerView coordinate={userCoord} anchor={{ x: 0.5, y: 0.5 }} allowOverlap>
              <NearbyRadarRings />
            </MarkerView>
          ) : null}

          {userCoord !== null ? (
            <MarkerView coordinate={userCoord} anchor={{ x: 0.5, y: 0.5 }} allowOverlap isSelected>
              <UserLocationMarker
                deviceHeading={deviceHeading}
                mapBearing={mapBearing}
                showHeadingBeam={hasHeading && (isWalkNavigating || viewMode === 'nearby')}
              />
            </MarkerView>
          ) : null}

          {pinZoomStyle.size > 0 &&
            pinsOnMap.map((s) => (
              <MarkerView
                key={s.id}
                coordinate={[s.lng, s.lat]}
                anchor={{ x: 0.5, y: 0.5 }}
                allowOverlap>
                <Pressable
                  onPress={() => handleMarkerPress(s)}
                  accessibilityRole="button"
                  accessibilityLabel={s.name}>
                  <KingdomMapPin
                    kingdom={s.kingdom}
                    zoomStyle={pinZoomStyle}
                    isGuideTarget={walkTarget?.sighting.id === s.id}
                  />
                </Pressable>
              </MarkerView>
            ))}

        </MapView>
        </View>
      </NativeViewGestureHandler>

      {/* ── Top overlay (hidden during directions preview / navigation) ── */}
      {!isWalkNavigating && !isWalkPreview ? (
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
      ) : null}

      {userCoord === null && (locationDenied || !locationLoading) && !isWalkActive ? (
        <View
          style={[styles.locationBannerWrap, { top: contentTopInset(insets.top) + 108 }]}
          pointerEvents="box-none">
          <LocationAccessBanner
            mode={locationDenied ? 'denied' : 'locating'}
            onEnableLocation={() => void handleEnableLocation()}
          />
        </View>
      ) : null}

      {isWalkNavigating && walkTarget && guideDisplay ? (
        <WalkDirectionsNav
          speciesName={walkTarget.sighting.name}
          instruction={guideDisplay.instruction}
          distanceRemainingM={guideDisplay.distanceM}
          durationRemainingSec={guideDisplay.durationRemainingSec}
          distanceUnit={distanceUnit}
          maneuverModifier={guideDisplay.maneuverModifier}
          maneuverType={guideDisplay.maneuverType}
          onExit={handleEndWalkGuide}
          onRecenter={handleRefitWalkRoute}
        />
      ) : null}

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
      {!isWalkNavigating ? (
      <>
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            styles.bottomSheet,
            sheetUsesExpandedTopAnchor
              ? { top: mapSheetTopY, bottom: 0 }
              : { height: sheetHeight, bottom: 0 },
            sheetStyle,
          ]}>
          <View style={[styles.sheetSurface, { paddingBottom: tabBarClearance }]}>
            {isWalkPreview && walkTarget ? (
              <View style={[styles.sheetInner, styles.sheetInnerDetail]}>
                <View style={styles.handle} />
                <WalkDirectionsPreview
                  speciesName={walkTarget.sighting.name}
                  routeSummary={routeSummary}
                  routeSteps={routeSteps}
                  isRouteLoading={isRouteLoading}
                  routeFailed={routeFailed}
                  distanceUnit={distanceUnit}
                  scrollBottomInset={walkPreviewFooterInset}
                  onExit={handleEndWalkGuide}
                />
              </View>
            ) : viewMode === 'sightings' ? (
              <SightingsSheet
                selectedSighting={viewMode === 'sightings' ? selectedSighting : null}
                distanceUnit={distanceUnit}
                hasLiveLocation={hasLiveLocation}
                onClearSelection={handleClearSheetSelection}
                onTakeMeThere={handleOpenWalkPreview}
                areaLabel={
                  hasLiveLocation
                    ? 'Around you'
                    : locationDenied
                      ? 'Location off'
                      : 'Locating…'
                }
                spotsCaptured={spotsCaptured}
              />
            ) : (
              <NearbySheet
                items={nearbyCommunity}
                isLoading={nearbyLoading}
                error={nearbyError}
                distanceUnit={distanceUnit}
                priorityMiles={NEARBY_PRIORITY_MILES}

                hasLiveLocation={hasLiveLocation}
                selectedSighting={selectedSighting}
                onSelectSighting={handleSelectMapSighting}
                onClearSelection={handleClearSheetSelection}
                onTakeMeThere={handleOpenWalkPreview}
              />
            )}
          </View>
        </Animated.View>
      </GestureDetector>

      {/* Walk preview: solid footer hides sheet content behind Exit + Start */}
      {isWalkPreview && walkTarget ? (
        <View
          style={[
            styles.walkPreviewFooter,
            { paddingBottom: tabBarClearance + FAB_SIZE / 2 },
          ]}>
          <View style={styles.walkPreviewActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Exit directions"
              onPress={handleEndWalkGuide}
              style={({ pressed }) => [styles.walkExitBtn, pressed && styles.walkBtnPressed]}>
              <Text style={styles.walkExitLabel}>Exit</Text>
            </Pressable>
            <View style={styles.walkStartShadow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Start walking directions"
                disabled={isRouteLoading}
                onPress={handleStartWalkNavigation}
                style={({ pressed }) => [
                  styles.walkStartBtn,
                  isRouteLoading && styles.walkStartDisabled,
                  pressed && !isRouteLoading && styles.walkStartPressed,
                ]}>
                <Ionicons name="navigate" size={20} color={colors.card} />
                <Text style={styles.walkStartLabel}>Start</Text>
              </Pressable>
            </View>
          </View>
        </View>
      ) : null}
      </>
      ) : null}
    </View>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface SightingsSheetProps {
  selectedSighting: NearbyMapSighting | null
  distanceUnit: DistanceUnit
  hasLiveLocation: boolean
  onClearSelection: () => void
  onTakeMeThere: (sighting: NearbyMapSighting) => void
  areaLabel: string
  spotsCaptured: number
}

function SightingsSheet({
  selectedSighting,
  distanceUnit,
  hasLiveLocation,
  onClearSelection,
  onTakeMeThere,
  areaLabel,
  spotsCaptured,
}: SightingsSheetProps) {
  const hasSightings = spotsCaptured > 0

  if (selectedSighting) {
    const canGuide =
      hasLiveLocation && isWithinNearbyRadius(selectedSighting.distanceM)
    return (
      <View style={[styles.sheetInner, styles.sheetInnerDetail]}>
        <View style={styles.handle} />
        <NearbySpotDetailCard
          sighting={selectedSighting}
          distanceUnit={distanceUnit}
          listLabel="My Sightings"
          canTakeMeThere={canGuide}
          onBack={onClearSelection}
          onTakeMeThere={() => onTakeMeThere(selectedSighting)}
        />
      </View>
    )
  }

  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>{areaLabel}</Text>
          <Text style={styles.sheetSub}>
            {hasSightings
              ? `${spotsCaptured} species spotted`
              : 'Nothing spotted yet — head outside!'}
          </Text>
        </View>
        {hasSightings ? (
          <View style={styles.statChip}>
            <Ionicons name="trending-up" size={13} color={colors.green} />
            <Text style={styles.statChipText}>Keep exploring</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

interface NearbySheetProps {
  items: NearbyMapSighting[]
  isLoading: boolean
  error: string | null
  distanceUnit: DistanceUnit
  priorityMiles: number
  hasLiveLocation: boolean
  selectedSighting: NearbyMapSighting | null
  onSelectSighting: (sighting: NearbyMapSighting) => void
  onClearSelection: () => void
  onTakeMeThere: (sighting: NearbyMapSighting) => void
}

function nearbyListSubtitle(item: NearbyMapSighting, distanceUnit: DistanceUnit): string {
  if (item.source === 'ai') return 'Commonly seen in this area'
  const distance = formatDistance(item.distanceM, distanceUnit)
  if (item.source === 'user') return `${distance} · Your sighting`
  if (item.spottedByUsername) return `${distance} · @${item.spottedByUsername}`
  if (item.explorerCount > 1) return `${distance} · ${item.explorerCount} explorers`
  return `${distance} · WildKind explorer`
}

function NearbyDistLine({
  item,
  distanceUnit,
}: {
  item: NearbyMapSighting
  distanceUnit: DistanceUnit
}) {
  const distance = formatDistance(item.distanceM, distanceUnit)

  if (item.source === 'gbif') {
    return (
      <View style={styles.nearbyDistRow}>
        <Text style={styles.nearbyDist}>{distance} ·</Text>
        <VerifiedIcon />
        <Text style={styles.nearbyDist}>Verified record</Text>
      </View>
    )
  }

  if (item.source === 'ai') {
    return <Text style={styles.nearbyDist}>Commonly seen in this area</Text>
  }

  return (
    <View style={styles.nearbyDistRow}>
      <Text style={styles.nearbyDist}>{nearbyListSubtitle(item, distanceUnit)}</Text>
    </View>
  )
}

function NearbySheet({
  items,
  isLoading,
  error,
  distanceUnit,
  priorityMiles,
  hasLiveLocation,
  selectedSighting,
  onSelectSighting,
  onClearSelection,
  onTakeMeThere,
}: NearbySheetProps) {
  const emptyMessage = error
    ?? (isLoading
      ? 'Loading nearby species…'
      : !hasLiveLocation
        ? `Turn on location to see species within ${priorityMiles} miles of you.`
        : nearbySearchEmptyMessage(distanceUnit))

  const canGuideToSighting = (sighting: NearbyMapSighting) =>
    hasLiveLocation && isWithinNearbyRadius(sighting.distanceM)

  if (selectedSighting) {
    return (
      <View style={[styles.sheetInner, styles.sheetInnerDetail]}>
        <View style={styles.handle} />
        <NearbySpotDetailCard
          sighting={selectedSighting}
          distanceUnit={distanceUnit}
          listLabel="Nearby"
          canTakeMeThere={canGuideToSighting(selectedSighting)}
          onBack={onClearSelection}
          onTakeMeThere={() => onTakeMeThere(selectedSighting)}
        />
      </View>
    )
  }

  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <Text style={styles.sheetTitle}>Nearby Species</Text>
      <Text style={[styles.sheetSub, { marginBottom: space[16] }]}>
        {hasLiveLocation
          ? "Let's explore what is near you and start collecting."
          : 'Waiting for GPS…'}
      </Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        scrollEnabled
        style={styles.nearbyList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.sheetSub}>{emptyMessage}</Text>}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View ${item.name} field guide`}
            onPress={() => onSelectSighting(item)}
            style={({ pressed }) => [styles.nearbyRowPressable, pressed && styles.nearbyRowPressed]}>
            <View style={styles.nearbyRow}>
              <View style={styles.nearbyMeta}>
                <View style={styles.nearbyNameRow}>
                  <NearbySpeciesName name={item.name} style={styles.nearbyName} />
                  {item.isNew && (
                    <View style={styles.newTag}>
                      <Text style={styles.newTagText}>NEW</Text>
                    </View>
                  )}
                </View>
                <NearbyDistLine item={item} distanceUnit={distanceUnit} />
              </View>
              <KingdomBadge kind={item.kingdom} />
            </View>
          </Pressable>
        )}
      />
    </View>
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
  guideBannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
  },
  locationBannerWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    paddingHorizontal: space[16],
  },
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

  // Bottom sheet — shadow on outer wrapper (overflow:hidden on inner clips shadow otherwise)
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...slideUpSheetRadius,
    ...shadow.sheetUp,
  },
  sheetSurface: {
    flex: 1,
    backgroundColor: colors.card,
    ...slideUpSheetRadius,
    overflow: 'hidden',
  },
  sheetInner: {
    flex: 1,
    paddingHorizontal: space[16],
    paddingTop: space[16],
  },
  sheetInnerDetail: {
    paddingTop: space[8],
  },
  nearbyRowPressable: {
    borderRadius: radius.md,
  },
  nearbyRowPressed: {
    backgroundColor: colors.bg2,
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
  nearbyDistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    marginTop: space[4],
    flexWrap: 'wrap',
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
    color: colors.ink,
  },
  nearbyDist: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
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
  walkPreviewFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space[16],
    paddingHorizontal: space[16],
    zIndex: 15,
  },
  walkPreviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[16],
  },
  walkExitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.hairline,
  },
  walkBtnPressed: {
    opacity: 0.7,
  },
  walkExitLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  walkStartShadow: {
    flex: 2,
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  walkStartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.green,
  },
  walkStartDisabled: {
    opacity: 0.5,
  },
  walkStartPressed: {
    transform: [{ translateY: 2 }],
  },
  walkStartLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
})
