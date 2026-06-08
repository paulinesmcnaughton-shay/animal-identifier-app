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
import { Image } from 'expo-image'
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
  useAnimatedReaction,
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
import { KINGDOM, KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { slideUpSheetHandle, slideUpSheetRadius } from '@/design/slide-up-sheet'
import { contentTopInset } from '@/design/screen-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useDeviceHeading } from '@/features/map/use-device-heading'
import { getKingdomPinZoomStyle } from '@/features/map/kingdom-pin-zoom'
import { arrowRotationDegrees, bearingDegrees, liveGuideDistanceM } from '@/features/map/map-guide-math'
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
import { categoryFilterSightings } from '@/features/map/sightings-category-search'
import { useReferenceImage } from '@/features/species/use-reference-image'
import { useUserSightingsData } from '@/features/sightings/use-user-sightings-data'
import { useAuth } from '@/lib/auth/auth-context'
import {
  isWithinNearbyRadius,
  NEARBY_PRIORITY_MILES,
} from '@/features/map/nearby-radius'
import { useNearbyCommunitySightings } from '@/features/map/use-nearby-community'
import { useUserLocation, type MapCoordinate } from '@/features/map/use-user-location'
import {
  MAP_SHEET_HEIGHT_DEFAULT,
  mapExpandedSheetTopY,
  WALK_PREVIEW_SUMMARY_PEEK_BODY,
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
/** Collapsed peek clearance when My Sightings has no spots (clears center camera FAB). */
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

function fuzzyFilterSightings(items: NearbyMapSighting[], query: string): NearbyMapSighting[] {
  if (!query) return items
  const words = query.split(/\s+/).filter(w => w.length >= 2)
  if (words.length === 0) return items.filter(s => s.name.toLowerCase().includes(query))
  const scored = items
    .map(s => {
      // Include name-without-spaces so "bluejay" matches "Blue Jay"
      const searchable =
        `${s.name} ${s.kingdom} ${s.scientificName ?? ''} ${s.name.replace(/\s/g, '')}`.toLowerCase()
      let score = 0
      for (const word of words) {
        if (searchable.includes(word)) score++
      }
      return { item: s, score }
    })
    .filter(({ score }) => score > 0)
  return scored.sort((a, b) => b.score - a.score).map(({ item }) => item)
}

/**
 * Shared filter for both tabs: tries broad category expansion first ("dog" → all dog breeds),
 * then falls back to fuzzy word matching for specific names.
 */
function filterSightings(items: NearbyMapSighting[], query: string): NearbyMapSighting[] {
  if (!query) return items
  const categoryResults = categoryFilterSightings(items, query)
  if (categoryResults !== null) return categoryResults
  return fuzzyFilterSightings(items, query)
}

export function MapScreenContent() {
  const insets = useSafeAreaInsets()
  const { height: windowHeight } = useWindowDimensions()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapView>(null)
  const mapNativeGestureRef = useRef<NativeViewGestureHandler>(null)
  const searchInputRef = useRef<TextInput>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('sightings')
  const [selectedSighting, setSelectedSighting] = useState<NearbyMapSighting | null>(null)
  const [walkSession, setWalkSession] = useState<WalkGuideSession | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [speciesPickerItems, setSpeciesPickerItems] = useState<NearbyMapSighting[] | null>(null)
  const [cityNames, setCityNames] = useState<Record<string, string>>({})
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [mapStyle, setMapStyle] = useState<'light' | 'terrain'>('light')
  const [zoom, setZoom] = useState(13)
  const [mapBearing, setMapBearing] = useState(0)
  const { heading: deviceHeading, isAvailable: hasHeading } = useDeviceHeading()
  const deviceHeadingRef = useRef(deviceHeading)
  deviceHeadingRef.current = deviceHeading
  const {
    coordinate: userCoord,
    isLive: hasLiveLocation,
    isLoading: locationLoading,
    permissionDenied: locationDenied,
    refreshLocation,
  } = useUserLocation()
  const { isAuthenticated } = useAuth()
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

  const mySightings = isAuthenticated ? mapPins : []
  const hasSightings = mySightings.length > 0

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredSightings = useMemo(() => {
    const filtered = filterSightings(mySightings, normalizedQuery)
    return [...filtered].sort((a, b) => a.distanceM - b.distanceM)
  }, [mySightings, normalizedQuery])

  const filteredNearby = useMemo(
    () => filterSightings(nearbyCommunity, normalizedQuery),
    [nearbyCommunity, normalizedQuery],
  )

  const activeItems = viewMode === 'nearby' ? filteredNearby : filteredSightings
  const pinsOnMap = activeItems

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

  const isFollowingWalkNavRef = useRef(true)
  const [isFollowingWalkPreview, setIsFollowingWalkPreview] = useState(true)
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
  const walkPreviewFooterBody =
    space[16] + WALK_PREVIEW_ACTION_HEIGHT + tabBarClearance + FAB_SIZE / 2
  const walkPreviewSummaryPeekHeight =
    WALK_PREVIEW_SUMMARY_PEEK_BODY + walkPreviewFooterBody
  const snapWalkPreviewCollapsed = Math.max(
    SNAP_EXPANDED,
    sheetHeight - walkPreviewSummaryPeekHeight,
  )
  const snapCollapsed =
    sheetHeight - (tabBarClearance + GAP_ABOVE_NAV + SHEET_HEADER_HEIGHT + SHEET_FAB_CLEARANCE_PEEK)
  const snapWalkPreview = Math.max(SNAP_EXPANDED, sheetHeight - WALK_PREVIEW_DEFAULT_HEIGHT)
  const fabClearance = sheetBottomInset(insets.bottom)
  const snapExpandedPin = Math.max(
    SNAP_EXPANDED,
    sheetHeight - PIN_PANEL_BODY_HEIGHT - fabClearance,
  )
  const snapExpandedY =
    isWalkPreview
    || viewMode === 'nearby'
    || selectedSighting !== null
    || (viewMode === 'sightings' && hasSightings)
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

  const sheetExpandable =
    isWalkPreview
    || (!isWalkNavigating
      && (viewMode === 'nearby'
        || selectedSighting !== null
        || (viewMode === 'sightings' && hasSightings)))

  const walkSessionRef = useRef(walkSession)
  walkSessionRef.current = walkSession
  const snapWalkPreviewCollapsedRef = useRef(snapWalkPreviewCollapsed)
  snapWalkPreviewCollapsedRef.current = snapWalkPreviewCollapsed
  const snapWalkPreviewRef = useRef(snapWalkPreview)
  snapWalkPreviewRef.current = snapWalkPreview
  const snapExpandedYRef = useRef(snapExpandedY)
  snapExpandedYRef.current = snapExpandedY
  const [walkDirectionsScrollEnabled, setWalkDirectionsScrollEnabled] = useState(false)
  const [sightingsListScrollEnabled, setSightingsListScrollEnabled] = useState(false)

  // Refs for NativeViewGestureHandler wrappers around each scrollable area inside
  // the sheet. Added to simultaneousWithExternalGesture so scroll and pan co-exist.
  const sightingsListRef = useRef<NativeViewGestureHandler>(null)
  const nearbyListRef = useRef<NativeViewGestureHandler>(null)
  const detailScrollRef = useRef<NativeViewGestureHandler>(null)
  // Tracks whether the current gesture started inside the handle/top-strip area.
  // Only gestures that start in the handle zone are allowed to move the sheet —
  // this prevents content-area scrolling from accidentally dismissing the sheet.
  const gestureStartedInHandle = useSharedValue(false)
  const listScrollY = useSharedValue(0)

  useAnimatedReaction(
    () => translateY.value < 12,
    (isExpanded) => {
      runOnJS(setWalkDirectionsScrollEnabled)(isExpanded)
      runOnJS(setSightingsListScrollEnabled)(isExpanded)
    },
    [translateY],
  )

  // Reset list scroll tracking whenever the visible sheet changes so a previously
  // scrolled list doesn't block sheet dismiss on the next interaction.
  useEffect(() => {
    listScrollY.value = 0
  }, [viewMode, selectedSighting, listScrollY])

  const sheetSnapY = useMemo((): number => {
    if (isWalkPreview) return snapWalkPreview
    if (isWalkNavigating) return snapCollapsed
    if (viewMode === 'nearby') return SNAP_EXPANDED
    if (selectedSighting !== null) return SNAP_EXPANDED
    if (viewMode === 'sightings' && hasSightings) return SNAP_EXPANDED
    return snapCollapsed
  }, [hasSightings, isWalkNavigating, isWalkPreview, selectedSighting, snapCollapsed, snapWalkPreview, viewMode])

  useEffect(() => {
    translateY.value = withSpring(sheetSnapY, SPRING)
  }, [sheetSnapY, translateY])

  // While the sheet is being dragged, disable the map's native pan/zoom/rotate so
  // it can't steal the gesture (caused the map to move + the sheet to feel laggy).
  const [sheetDragging, setSheetDragging] = useState(false)

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(sheetExpandable)
        // Allow the pan gesture and inner scroll gestures to run simultaneously.
        // onUpdate gates movement so only handle-area drags actually move the sheet.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .simultaneousWithExternalGesture(sightingsListRef as React.RefObject<any>, nearbyListRef as React.RefObject<any>, detailScrollRef as React.RefObject<any>)
        .activeOffsetY([-PAN_ACTIVE_OFFSET_Y, PAN_ACTIVE_OFFSET_Y])
        .failOffsetX([...PAN_FAIL_OFFSET_X])
        .onStart((e) => {
          context.value = translateY.value
          // e.y is relative to the GestureDetector's view (top of the bottom sheet).
          // The handle pill sits in the first ~56px — only allow sheet movement from there.
          gestureStartedInHandle.value = e.y < 56
          runOnJS(setSheetDragging)(true)
        })
        .onUpdate((e) => {
          // If the touch started outside the handle zone (i.e. in scrollable content),
          // let the inner scroll handle it — do not move the sheet at all.
          if (!gestureStartedInHandle.value) return

          const isWalkPreviewDrag = walkSessionRef.current?.phase === 'preview'
          const maxDragY = isWalkPreviewDrag
            ? snapWalkPreviewCollapsedRef.current
            : snapCollapsed
          translateY.value = Math.max(
            snapExpandedYRef.current,
            Math.min(maxDragY, context.value + e.translationY),
          )
        })
        .onEnd((e) => {
          if (walkSessionRef.current?.phase === 'preview') {
            const collapsedY = snapWalkPreviewCollapsedRef.current
            const defaultY = snapWalkPreviewRef.current
            const y = translateY.value

            if (e.velocityY < -400) {
              translateY.value = withSpring(SNAP_EXPANDED, SPRING)
              return
            }
            if (e.velocityY > 400) {
              translateY.value = withSpring(collapsedY, SPRING)
              return
            }

            const midExpandDefault = defaultY / 2
            const midDefaultCollapsed = (defaultY + collapsedY) / 2

            if (y < midExpandDefault) {
              translateY.value = withSpring(SNAP_EXPANDED, SPRING)
            } else if (y < midDefaultCollapsed) {
              translateY.value = withSpring(defaultY, SPRING)
            } else {
              translateY.value = withSpring(collapsedY, SPRING)
            }
            return
          }

          const mid = (snapCollapsed + snapExpandedY) / 2
          if (e.velocityY < -500 || translateY.value < mid) {
            translateY.value = withSpring(snapExpandedY, SPRING)
            return
          }
          if (selectedSightingRef.current !== null) {
            runOnJS(dismissSheetDetail)()
            return
          }
          translateY.value = withSpring(snapCollapsed, SPRING)
        })
        .onFinalize(() => {
          runOnJS(setSheetDragging)(false)
        }),
    [context, dismissSheetDetail, gestureStartedInHandle, listScrollY, sheetExpandable, snapCollapsed, snapExpandedY, translateY],
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
    isFollowingWalkNavRef.current = true
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

      const heading = resolveWalkNavHeading(deviceHeadingRef.current, userCoord, lookAhead)

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
    [userCoord, walkGuideMetrics, walkNavPadding, walkTarget],
  )

  const focusWalkNavigationCameraRef = useRef(focusWalkNavigationCamera)
  focusWalkNavigationCameraRef.current = focusWalkNavigationCamera

  const handleRefitWalkRoute = useCallback(() => {
    if (!walkTarget || userCoord === null) return
    if (isWalkNavigating) {
      isFollowingWalkNavRef.current = true
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
    if (!isWalkPreview || !isFollowingWalkPreview || !walkGuideMetrics?.routeCoordinates.length) return
    fitMapGuideCameraToRoute({
      cameraRef,
      coordinates: walkGuideMetrics.routeCoordinates,
      padding: previewCameraPadding,
    })
  }, [isFollowingWalkPreview, isWalkPreview, previewCameraPadding, walkGuideMetrics?.routeCoordinates])

  const handleOpenWalkPreview = useCallback(
    (sighting: NearbyMapSighting) => {
      if (userCoord === null) return
      if (!isWithinNearbyRadius(sighting.distanceM)) return
      setIsFollowingWalkPreview(true)
      setWalkSession({ target: createMapGuideTarget(sighting), phase: 'preview' })
      setSelectedSighting(null)
    },
    [userCoord],
  )

  const handleStartWalkNavigation = useCallback(() => {
    isFollowingWalkNavRef.current = true
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

  const geocodePlace = useCallback(async (query: string): Promise<void> => {
    if (!MAPBOX_TOKEN) return
    setIsGeocoding(true)
    try {
      const q = encodeURIComponent(query)
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${MAPBOX_TOKEN}&types=place,region,country,district&limit=1`,
      )
      const json = await res.json() as { features?: Array<{ center: [number, number]; relevance?: number }> }
      const feature = json.features?.[0]
      // Only fly if Mapbox is highly confident this is an exact place match (relevance >= 0.85)
      if (feature?.center && (feature.relevance ?? 0) >= 0.85) {
        cameraRef.current?.setCamera({
          centerCoordinate: feature.center,
          zoomLevel: 10,
          animationDuration: 800,
        })
      }
    } catch {
      // silent fail
    } finally {
      setIsGeocoding(false)
    }
  }, [])

  const handleSearchSubmit = useCallback(() => {
    const query = searchQuery.trim()
    if (!query) return
    // Both tabs filter reactively — pressing return should never auto-open a card
    if (viewMode === 'sightings' || viewMode === 'nearby') return
    const matches = activeItems
    if (matches.length > 1) {
      setSpeciesPickerItems(matches)
      return
    }
    if (matches.length === 1) {
      handleSelectMapSighting(matches[0]!)
      return
    }
    // No species matches — try geocoding if it could be a place name (multi-word or 6+ chars)
    if (query.includes(' ') || query.length >= 6) {
      void geocodePlace(query)
    }
  }, [activeItems, geocodePlace, handleSelectMapSighting, searchQuery, viewMode])

  const handleCloseSpeciesPicker = useCallback(() => {
    setSpeciesPickerItems(null)
  }, [])

  const handlePickerSelect = useCallback(
    (item: NearbyMapSighting) => {
      setSpeciesPickerItems(null)
      handleSelectMapSighting(item)
    },
    [handleSelectMapSighting],
  )

  useEffect(() => {
    if (!speciesPickerItems || speciesPickerItems.length === 0 || !MAPBOX_TOKEN) return
    const loadCityNames = async () => {
      const entries = await Promise.all(
        speciesPickerItems.map(async (item) => {
          try {
            const res = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${item.lng},${item.lat}.json?access_token=${MAPBOX_TOKEN}&types=place,locality&limit=1`,
            )
            const json = await res.json() as { features?: Array<{ text: string }> }
            const city = json.features?.[0]?.text ?? `${item.lat.toFixed(1)}, ${item.lng.toFixed(1)}`
            return [item.id, city] as const
          } catch {
            return [item.id, `${item.lat.toFixed(1)}, ${item.lng.toFixed(1)}`] as const
          }
        }),
      )
      setCityNames(Object.fromEntries(entries))
    }
    void loadCityNames()
  }, [speciesPickerItems])

  const handleSearchChange = (text: string) => {
    setSearchQuery(text)
    setSpeciesPickerItems(null)
    if (text === '') {
      searchInputRef.current?.blur()
      if (userCoord !== null) {
        cameraRef.current?.setCamera({
          centerCoordinate: userCoord,
          zoomLevel: 15,
          animationDuration: 500,
        })
      }
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
    setSpeciesPickerItems(null)
    if (userCoord !== null) {
      cameraRef.current?.setCamera({
        centerCoordinate: userCoord,
        zoomLevel: 15,
        animationDuration: 500,
      })
    }
  }

  const handleLocateMe = () => {
    if (userCoord === null) return
    if (isWalkNavigating) {
      isFollowingWalkNavRef.current = true
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

  const handleExpandSightingsSheet = useCallback(() => {
    translateY.value = withSpring(SNAP_EXPANDED, SPRING)
  }, [translateY])

  const handleToggleStyle = () => {
    setMapStyle((s) => s === 'light' ? 'terrain' : 'light')
  }

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode)
    setSelectedSighting(null)
    setWalkSession(null)
  }

  const handleCameraChanged = useCallback(
    (state: {
      properties: { zoom: number; heading: number }
      gestures: { isGestureActive: boolean }
    }) => {
      setZoom(state.properties.zoom)
      const heading = state.properties.heading
      if (typeof heading === 'number' && Number.isFinite(heading)) {
        setMapBearing(heading)
      }
      if (state.gestures.isGestureActive) {
        if (isWalkNavigating) isFollowingWalkNavRef.current = false
        if (isWalkPreview) setIsFollowingWalkPreview(false)
      }
    },
    [isWalkNavigating, isWalkPreview],
  )

  return (
    <View style={styles.root}>
      <NativeViewGestureHandler ref={mapNativeGestureRef} disallowInterruption>
        <View style={StyleSheet.absoluteFill}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          styleURL={activeMapStyleUrl}
          scrollEnabled={!sheetDragging}
          zoomEnabled={!sheetDragging}
          pitchEnabled={false}
          rotateEnabled={!sheetDragging}
          requestDisallowInterceptTouchEvent
          gestureSettings={{
            pinchZoomEnabled: !sheetDragging,
            pinchPanEnabled: !sheetDragging,
            panEnabled: !sheetDragging,
            rotateEnabled: !sheetDragging,
          }}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
          onPress={handleMapPress}
          onCameraChanged={handleCameraChanged}
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
            ref={searchInputRef}
            placeholder="Search by cities, animals or plants"
            placeholderTextColor={colors.dim}
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
          />
          {isGeocoding ? (
            <Animated.View style={styles.geocodingSpinner}>
              <Ionicons name="globe-outline" size={16} color={colors.greenLight} />
            </Animated.View>
          ) : null}
          {searchQuery.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={handleClearSearch}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={16} color={colors.dim} />
            </Pressable>
          ) : null}
        </View>

        {locationDenied ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enable GPS location"
            onPress={() => void handleEnableLocation()}
            style={styles.gpsBanner}>
            <Ionicons name="location-outline" size={14} color={colors.ink2} />
            <Text style={styles.gpsBannerText}>
              GPS is disabled — sightings won't have location.{' '}
              <Text style={styles.gpsBannerAllow}>Allow</Text>
            </Text>
          </Pressable>
        ) : null}

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

      {/* ── Species selection picker ── */}
      {speciesPickerItems !== null ? (
        <>
          <Pressable
            style={[StyleSheet.absoluteFill, styles.pickerBackdrop]}
            onPress={handleCloseSpeciesPicker}
          />
          <View style={[styles.speciesPicker, { paddingBottom: tabBarClearance }]}>
            <View style={styles.handle} />
            <View style={styles.speciesPickerHeader}>
              <Text style={styles.sheetTitle}>
                {speciesPickerItems.length} result{speciesPickerItems.length === 1 ? '' : 's'}
              </Text>
              <Text style={styles.sheetSub}>
                "{searchQuery}" · spotted in multiple locations
              </Text>
            </View>
            <FlatList
              data={speciesPickerItems}
              keyExtractor={(item) => item.id}
              scrollEnabled
              showsVerticalScrollIndicator={false}
              style={styles.nearbyList}
              contentContainerStyle={{ paddingBottom: space[8] }}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handlePickerSelect(item)}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name} in ${cityNames[item.id] ?? 'unknown location'}`}
                  style={({ pressed }) => [styles.nearbyRowPressable, pressed && styles.nearbyRowPressed]}>
                  <View style={styles.nearbyRow}>
                    <View style={styles.nearbyMeta}>
                      <NearbySpeciesName name={item.name} style={styles.nearbyName} />
                      <Text style={styles.nearbyDist}>
                        {cityNames[item.id]
                          ? `${cityNames[item.id]} · ${item.date}`
                          : item.date}
                      </Text>
                    </View>
                    <KingdomBadge kind={item.kingdom} />
                  </View>
                </Pressable>
              )}
            />
          </View>
        </>
      ) : null}

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
          <View
            style={[
              styles.sheetSurface,
              { paddingBottom: isWalkPreview ? 0 : tabBarClearance },
            ]}>
            {isWalkPreview && walkTarget ? (
              <View style={[styles.sheetInner, styles.sheetInnerDetail, styles.walkPreviewSheet]}>
                <View style={styles.walkPreviewDragZone}>
                  <View style={styles.handle} />
                </View>
                <View style={styles.walkPreviewContent}>
                  <WalkDirectionsPreview
                    speciesName={walkTarget.sighting.name}
                    routeSummary={routeSummary}
                    routeSteps={routeSteps}
                    isRouteLoading={isRouteLoading}
                    routeFailed={routeFailed}
                    distanceUnit={distanceUnit}
                    scrollEnabled={walkDirectionsScrollEnabled}
                    onExit={handleEndWalkGuide}
                  />
                </View>
                <View
                  style={[
                    styles.walkPreviewFooterInSheet,
                    { paddingBottom: tabBarClearance + FAB_SIZE / 2 },
                  ]}>
                  <View style={styles.walkPreviewActions}>
                    <View style={styles.walkExitShadow}>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel="Exit directions"
                        onPress={handleEndWalkGuide}
                        style={({ pressed }) => [styles.walkExitBtn, pressed && styles.walkBtnPressed]}>
                        <Text style={styles.walkExitLabel}>Exit</Text>
                      </Pressable>
                    </View>
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
              </View>
            ) : viewMode === 'sightings' ? (
              <SightingsSheet
                items={filteredSightings}
                selectedSighting={selectedSighting}
                distanceUnit={distanceUnit}
                listScrollEnabled={sightingsListScrollEnabled}
                onSelectSighting={handleSelectMapSighting}
                onClearSelection={handleClearSheetSelection}
                searchQuery={normalizedQuery}
                onExpandSheet={handleExpandSightingsSheet}
                listGestureRef={sightingsListRef}
                onListScroll={(y) => { listScrollY.value = y }}
                detailScrollGestureRef={detailScrollRef}
                onDetailScroll={(y) => { listScrollY.value = y }}
              />
            ) : (
              <NearbySheet
                items={filteredNearby}
                isLoading={nearbyLoading}
                error={nearbyError}
                distanceUnit={distanceUnit}
                priorityMiles={NEARBY_PRIORITY_MILES}
                searchQuery={normalizedQuery}
                hasLiveLocation={hasLiveLocation}
                selectedSighting={selectedSighting}
                onSelectSighting={handleSelectMapSighting}
                onClearSelection={handleClearSheetSelection}
                onTakeMeThere={handleOpenWalkPreview}
                onExpandSheet={handleExpandSightingsSheet}
                listScrollEnabled={sightingsListScrollEnabled}
                listGestureRef={nearbyListRef}
                onListScroll={(y) => { listScrollY.value = y }}
                detailScrollGestureRef={detailScrollRef}
                onDetailScroll={(y) => { listScrollY.value = y }}
              />
            )}
          </View>
        </Animated.View>
      </GestureDetector>
      </>
      ) : null}
    </View>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const SIGHTINGS_INITIAL_SHOWN = 100
const SIGHTINGS_PAGE_SIZE = 50

interface SightingsSheetProps {
  items: NearbyMapSighting[]
  selectedSighting: NearbyMapSighting | null
  distanceUnit: DistanceUnit
  searchQuery: string
  listScrollEnabled: boolean
  onSelectSighting: (sighting: NearbyMapSighting) => void
  onClearSelection: () => void
  onExpandSheet: () => void
  listGestureRef: React.RefObject<NativeViewGestureHandler | null>
  onListScroll: (y: number) => void
  detailScrollGestureRef: React.RefObject<NativeViewGestureHandler | null>
  onDetailScroll: (y: number) => void
}

function SightingsSheet({
  items,
  selectedSighting,
  distanceUnit,
  searchQuery,
  listScrollEnabled,
  onSelectSighting,
  onClearSelection,
  onExpandSheet,
  listGestureRef,
  onListScroll,
  detailScrollGestureRef,
  onDetailScroll,
}: SightingsSheetProps) {
  const [shownCount, setShownCount] = useState(SIGHTINGS_INITIAL_SHOWN)
  const prevItemCountRef = useRef(items.length)

  useEffect(() => {
    if (items.length !== prevItemCountRef.current) {
      setShownCount(SIGHTINGS_INITIAL_SHOWN)
      prevItemCountRef.current = items.length
    }
  }, [items.length])

  if (selectedSighting) {
    return (
      <View style={[styles.sheetInner, styles.sheetInnerDetail]}>
        <View style={styles.handle} />
        <NearbySpotDetailCard
          sighting={selectedSighting}
          distanceUnit={distanceUnit}
          listLabel="My Sightings"
          canTakeMeThere={false}
          showDirections={false}
          onBack={onClearSelection}
          onTakeMeThere={() => {}}
          scrollGestureRef={detailScrollGestureRef}
          onScrollY={onDetailScroll}
        />
      </View>
    )
  }

  const visibleItems = items.slice(0, shownCount)
  const remaining = items.length - shownCount
  const hasMore = remaining > 0

  const handleShowMore = () => {
    setShownCount((prev) => prev + SIGHTINGS_PAGE_SIZE)
    onExpandSheet()
  }

  const subtitle = searchQuery
    ? items.length === 0
      ? '0 results found'
      : `${items.length} result${items.length === 1 ? '' : 's'} found for "${searchQuery}"`
    : items.length > 0
      ? `${items.length} species spotted around the world`
      : 'Nothing spotted yet — head outside!'

  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <Text style={styles.sheetTitle}>My Sightings</Text>
      <Text style={[styles.sheetSub, { marginBottom: space[16] }]}>{subtitle}</Text>
      <NativeViewGestureHandler ref={listGestureRef}>
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={listScrollEnabled}
          style={styles.nearbyList}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => onListScroll(nativeEvent.contentOffset.y)}
          ListEmptyComponent={null}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            hasMore ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Show ${Math.min(SIGHTINGS_PAGE_SIZE, remaining)} more sightings`}
                onPress={handleShowMore}
                style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMorePressed]}>
                <Text style={styles.showMoreLabel}>
                  Show more ({remaining} remaining)
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.greenLight} />
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name}`}
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
                  <Text style={styles.nearbyDist}>{item.date}</Text>
                </View>
                <KingdomBadge kind={item.kingdom} />
              </View>
            </Pressable>
          )}
        />
      </NativeViewGestureHandler>
    </View>
  )
}

interface NearbySheetProps {
  items: NearbyMapSighting[]
  isLoading: boolean
  error: string | null
  distanceUnit: DistanceUnit
  priorityMiles: number
  searchQuery: string
  hasLiveLocation: boolean
  selectedSighting: NearbyMapSighting | null
  onSelectSighting: (sighting: NearbyMapSighting) => void
  onClearSelection: () => void
  onTakeMeThere: (sighting: NearbyMapSighting) => void
  onExpandSheet: () => void
  listScrollEnabled: boolean
  listGestureRef: React.RefObject<NativeViewGestureHandler | null>
  onListScroll: (y: number) => void
  detailScrollGestureRef: React.RefObject<NativeViewGestureHandler | null>
  onDetailScroll: (y: number) => void
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
  searchQuery,
  hasLiveLocation,
  selectedSighting,
  onSelectSighting,
  onClearSelection,
  onTakeMeThere,
  onExpandSheet,
  listScrollEnabled,
  listGestureRef,
  onListScroll,
  detailScrollGestureRef,
  onDetailScroll,
}: NearbySheetProps) {
  const [shownCount, setShownCount] = useState(SIGHTINGS_INITIAL_SHOWN)
  const prevItemCountRef = useRef(items.length)

  useEffect(() => {
    if (items.length !== prevItemCountRef.current) {
      setShownCount(SIGHTINGS_INITIAL_SHOWN)
      prevItemCountRef.current = items.length
    }
  }, [items.length])

  const emptyMessage = error
    ?? (isLoading
      ? 'Loading nearby species…'
      : searchQuery
        ? `No species matching "${searchQuery}" nearby.`
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
          scrollGestureRef={detailScrollGestureRef}
          onScrollY={onDetailScroll}
        />
      </View>
    )
  }

  const visibleItems = items.slice(0, shownCount)
  const remaining = items.length - shownCount
  const hasMore = remaining > 0

  const handleShowMore = () => {
    setShownCount((prev) => prev + SIGHTINGS_PAGE_SIZE)
    onExpandSheet()
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
      <NativeViewGestureHandler ref={listGestureRef}>
        <FlatList
          data={visibleItems}
          keyExtractor={(item) => item.id}
          scrollEnabled={listScrollEnabled}
          style={styles.nearbyList}
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          onScroll={({ nativeEvent }) => onListScroll(nativeEvent.contentOffset.y)}
          ListEmptyComponent={<Text style={styles.sheetSub}>{emptyMessage}</Text>}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListFooterComponent={
            hasMore ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Show ${Math.min(SIGHTINGS_PAGE_SIZE, remaining)} more nearby species`}
                onPress={handleShowMore}
                style={({ pressed }) => [styles.showMoreBtn, pressed && styles.showMorePressed]}>
                <Text style={styles.showMoreLabel}>
                  Show more ({remaining} remaining)
                </Text>
                <Ionicons name="chevron-down" size={14} color={colors.greenLight} />
              </Pressable>
            ) : null
          }
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${item.name} field guide`}
              onPress={() => {
                if (__DEV__) {
                  console.log('NEARBY CARD IMAGE BEFORE OPEN', {
                    id: item.id,
                    speciesName: item.name,
                    speciesId: item.speciesId ?? null,
                    previewImageUrl: item.previewImageUrl ?? null,
                  })
                }
                onSelectSighting(item)
              }}
              style={({ pressed }) => [styles.nearbyRowPressable, pressed && styles.nearbyRowPressed]}>
              <View style={styles.nearbyRow}>
                <RowThumbnail
                  previewImageUrl={item.previewImageUrl}
                  name={item.name}
                  scientificName={item.scientificName}
                  kingdom={item.kingdom}
                  sightingId={item.id}
                  speciesId={item.speciesId}
                />
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
      </NativeViewGestureHandler>
    </View>
  )
}

// ─── Row thumbnail ────────────────────────────────────────────────────────────

function RowThumbnail({
  previewImageUrl,
  name,
  scientificName,
  kingdom,
  sightingId,
  speciesId,
}: {
  previewImageUrl: string | null | undefined
  name: string
  scientificName?: string | null
  kingdom: string
  sightingId?: string
  speciesId?: string | null
}) {
  const tint = KINGDOM[kingdom as KingdomKey]?.bg ?? colors.hairline
  const [imageFailed, setImageFailed] = useState(false)

  // The species reference resolver caches successes persistently across unmounts
  // and never poisons on transient errors — so the image survives opening/closing
  // the detail card. The user's own sighting photo (previewImageUrl) takes
  // precedence; we skip the species lookup entirely when a preview already exists.
  const hasPreview = !!previewImageUrl?.trim()
  const { uri: taxaUrl } = useReferenceImage(
    {
      commonName: hasPreview ? '' : name,
      scientificName: hasPreview ? null : scientificName,
      kingdom: kingdom as KingdomKey,
      speciesId,
    },
    { screen: 'map', component: 'RowThumbnail' },
  )

  // Stable image URL: prefer previewImageUrl (direct from sighting), then reference lookup.
  const resolvedUrl = previewImageUrl?.trim() || taxaUrl || null
  const imageUrl = imageFailed ? null : resolvedUrl

  // Per-item failure state, keyed by the resolved URL — a broken load falls back
  // to the kingdom emoji and never poisons another row.
  useEffect(() => {
    setImageFailed(false)
  }, [resolvedUrl])

  return (
    <View style={[styles.rowThumb, { backgroundColor: tint }]}>
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={styles.rowThumbImage}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Text style={styles.rowThumbEmoji}>{KINGDOM[kingdom as KingdomKey]?.emoji ?? '🌿'}</Text>
      )}
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
  gpsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    ...shadow.card,
  },
  gpsBannerText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
  },
  gpsBannerAllow: {
    fontWeight: typeTokens.body.weights.bold,
    color: colors.greenLight,
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
  walkPreviewSheet: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 0,
  },
  walkPreviewDragZone: {
    paddingHorizontal: space[16],
    paddingBottom: space[8],
  },
  walkPreviewContent: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: space[16],
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
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    paddingVertical: space[16],
    marginTop: space[8],
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
  },
  showMorePressed: {
    opacity: 0.7,
  },
  showMoreLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.greenLight,
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
  rowThumb: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: 'hidden',
    flexShrink: 0,
  },
  rowThumbImage: {
    width: 44,
    height: 44,
  },
  rowThumbEmoji: {
    fontSize: 22,
    textAlign: 'center' as const,
    lineHeight: 44,
    width: 44,
  },
  walkPreviewFooterInSheet: {
    backgroundColor: colors.card,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: space[16],
    paddingHorizontal: space[16],
  },
  walkPreviewActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[16],
  },
  walkExitShadow: {
    flex: 1,
    backgroundColor: 'rgba(115, 136, 160, 0.15)',
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  walkExitBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  walkBtnPressed: {
    transform: [{ translateY: 2 }],
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

  // Geocoding spinner inline in search bar
  geocodingSpinner: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Species picker overlay
  pickerBackdrop: {
    zIndex: 25,
    backgroundColor: 'rgba(21, 33, 48, 0.35)',
  },
  speciesPicker: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '60%',
    paddingHorizontal: space[16],
    paddingTop: space[16],
    ...shadow.sheetUp,
  },
  speciesPickerHeader: {
    gap: space[4],
    marginBottom: space[16],
  },
})
