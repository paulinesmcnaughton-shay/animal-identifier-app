import React from 'react'
import { Ionicons } from '@expo/vector-icons'
import Mapbox, {
  Camera,
  CircleLayer,
  MapView,
  MarkerView,
  ShapeSource,
} from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KINGDOM, KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

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

const NEARBY_MOCK: (Sighting & { distanceM: number })[] = [
  { ...MOCK_SIGHTINGS[0], distanceM: 120 },
  { ...MOCK_SIGHTINGS[6], distanceM: 280 },
  { ...MOCK_SIGHTINGS[1], distanceM: 350 },
  { ...MOCK_SIGHTINGS[9], distanceM: 490 },
  { ...MOCK_SIGHTINGS[3], distanceM: 620 },
  { ...MOCK_SIGHTINGS[7], distanceM: 850 },
  { ...MOCK_SIGHTINGS[4], distanceM: 1100 },
  { ...MOCK_SIGHTINGS[2], distanceM: 1400 },
]

const USER_COORD: [number, number] = [-0.090, 51.505]


const userGeoJSON: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: [{ type: 'Feature', id: 'user', geometry: { type: 'Point', coordinates: USER_COORD }, properties: {} }],
}

function formatDist(m: number): string {
  return m < 1000 ? `${m}m away` : `${(m / 1000).toFixed(1)}km away`
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const SHEET_HEIGHT = 380
const SHEET_HEADER_HEIGHT = 80
const TAB_BAR_HEIGHT = 60
const GAP_ABOVE_NAV = 0
const SNAP_EXPANDED = 0
const SPRING = { damping: 42, stiffness: 180 }

type ViewMode = 'sightings' | 'nearby'

export function MapScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<Camera>(null)
  const mapRef = useRef<MapView>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('sightings')
  const [selectedSighting, setSelectedSighting] = useState<Sighting | null>(null)
  const [mapStyle, setMapStyle] = useState<'light' | 'terrain'>('light')
  const [zoom, setZoom] = useState(13)

  const pinSize = calcPinSize(zoom)
  const showEmoji = zoom >= 15

  // Prevents the MapView onPress from firing immediately after a pin tap
  const pinJustTappedRef = useRef(false)

  const snapCollapsed = SHEET_HEIGHT - (insets.bottom + TAB_BAR_HEIGHT + GAP_ABOVE_NAV + SHEET_HEADER_HEIGHT)

  const translateY = useSharedValue(snapCollapsed)
  const context = useSharedValue(0)

  const panGesture = Gesture.Pan()
    .onStart(() => { context.value = translateY.value })
    .onUpdate((e) => {
      translateY.value = Math.max(SNAP_EXPANDED, Math.min(snapCollapsed, context.value + e.translationY))
    })
    .onEnd((e) => {
      const mid = snapCollapsed / 2
      if (e.velocityY < -500 || translateY.value < mid) {
        translateY.value = withSpring(SNAP_EXPANDED, SPRING)
      } else {
        translateY.value = withSpring(snapCollapsed, SPRING)
      }
    })

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const handleMarkerPress = (sighting: Sighting) => {
    pinJustTappedRef.current = true
    setSelectedSighting(sighting)
    translateY.value = withSpring(SNAP_EXPANDED, SPRING)
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
      centerCoordinate: USER_COORD,
      zoomLevel: 15,
      animationDuration: 600,
    })
  }

  const handleToggleStyle = () => {
    setMapStyle((s) => s === 'light' ? 'terrain' : 'light')
  }

  const handleToggleView = (mode: ViewMode) => {
    setViewMode(mode)
  }

  const handleViewInDex = () => {
    router.push('/(tabs)/dex' as never)
  }

  return (
    <View style={styles.root}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        styleURL={mapStyle === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/outdoors-v12'}
        logoEnabled={false}
        attributionEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
        onPress={handleMapPress}
        onRegionDidChange={(f) => setZoom(f.properties.zoomLevel)}
        onMapLoadingError={() => console.warn('MapLoadError: check token and network')}>

        <Camera
          ref={cameraRef}
          defaultSettings={{ centerCoordinate: USER_COORD, zoomLevel: 13 }}
        />

        <MarkerView coordinate={USER_COORD} anchor={{ x: 0.5, y: 0.5 }} allowOverlap isSelected>
          <UserLocationMarker />
        </MarkerView>

        {zoom >= 10 && MOCK_SIGHTINGS.map((s) => (
          <MarkerView key={s.id} coordinate={[s.lng, s.lat]} anchor={{ x: 0.5, y: 1 }} allowOverlap>
            <Pressable onPress={() => handleMarkerPress(s)} accessibilityRole="button" accessibilityLabel={s.name}>
              <MapPin kingdom={s.kingdom} size={pinSize} showEmoji={showEmoji} />
            </Pressable>
          </MarkerView>
        ))}

        {/* Radar rings — nearby mode only */}
        {viewMode === 'nearby' && (
          <ShapeSource id="radar-src" shape={userGeoJSON}>
            <CircleLayer id="ring3" style={{ circleRadius: 90, circleColor: colors.green, circleOpacity: 0.04 }} />
            <CircleLayer id="ring2" style={{ circleRadius: 60, circleColor: colors.green, circleOpacity: 0.07 }} />
            <CircleLayer id="ring1" style={{ circleRadius: 30, circleColor: colors.green, circleOpacity: 0.12 }} />
            <CircleLayer id="ring-b3" style={{ circleRadius: 90, circleColor: 'transparent', circleStrokeWidth: 1.5, circleStrokeColor: `${colors.green}40` }} />
            <CircleLayer id="ring-b2" style={{ circleRadius: 60, circleColor: 'transparent', circleStrokeWidth: 1.5, circleStrokeColor: `${colors.green}60` }} />
            <CircleLayer id="ring-b1" style={{ circleRadius: 30, circleColor: 'transparent', circleStrokeWidth: 1.5, circleStrokeColor: `${colors.green}99` }} />
          </ShapeSource>
        )}
      </MapView>

      {/* ── Top overlay ── */}
      <View style={[styles.topOverlay, { paddingTop: insets.top + space[8] }]}>
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
        <Animated.View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 70 }, sheetStyle]}>
          {viewMode === 'sightings'
            ? <SightingsSheet selectedSighting={selectedSighting} onViewInDex={handleViewInDex} />
            : <NearbySheet />
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
}

function SightingsSheet({ selectedSighting, onViewInDex }: SheetProps) {
  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <View style={styles.sheetRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sheetTitle}>Hyde Park Area</Text>
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

function NearbySheet() {
  return (
    <View style={styles.sheetInner}>
      <View style={styles.handle} />
      <Text style={styles.sheetTitle}>Nearby Species</Text>
      <Text style={[styles.sheetSub, { marginBottom: space[12] }]}>Within 2km of you</Text>
      <FlatList
        data={NEARBY_MOCK}
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

// ─── Map pin ─────────────────────────────────────────────────────────────────

const PIN_SIZE = 46

function calcPinSize(zoom: number): number {
  const MIN_SIZE = 10
  const MIN_ZOOM = 13
  const MAX_ZOOM = 16
  if (zoom >= MAX_ZOOM) return PIN_SIZE
  const t = Math.max(0, (zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM))
  return Math.round(MIN_SIZE + t * (PIN_SIZE - MIN_SIZE))
}

function darkenHex(hex: string, amount = 45): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - amount)
  const g = Math.max(0, ((n >> 8) & 0xff) - amount)
  const b = Math.max(0, (n & 0xff) - amount)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function MapPin({ kingdom: k, size, showEmoji }: { kingdom: KingdomKey; size: number; showEmoji: boolean }) {
  const { bg, emoji } = KINGDOM[k]
  const border = darkenHex(bg)
  const borderWidth = Math.max(1.5, (size / PIN_SIZE) * 2.5)
  const ptW = Math.max(3, Math.round(size * 0.2))
  const ptH = Math.max(4, Math.round(size * 0.24))
  const emojiFontSize = Math.round(size * 0.43)

  return (
    <View style={pinStyles.wrap}>
      <View style={[
        pinStyles.circleBase,
        { width: size, height: size, borderRadius: size / 2, borderWidth, backgroundColor: bg, borderColor: border },
      ]}>
        {showEmoji && <Text style={{ fontSize: emojiFontSize, lineHeight: emojiFontSize + 4 }}>{emoji}</Text>}
      </View>
      {size >= 18 && <View style={[pinStyles.pointerBase, { borderLeftWidth: ptW, borderRightWidth: ptW, borderTopWidth: ptH, borderTopColor: border }]} />}
    </View>
  )
}

const pinStyles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  circleBase: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#152130',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  pointerBase: {
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
})

// ─── User location marker ────────────────────────────────────────────────────

function UserLocationMarker() {
  const scale = useSharedValue(0.4)
  const opacity = useSharedValue(0.9)

  useEffect(() => {
    scale.value = withRepeat(withTiming(3, { duration: 2200 }), -1, false)
    opacity.value = withRepeat(withTiming(0, { duration: 2200 }), -1, false)
  }, [])

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }))

  return (
    <View style={userStyles.wrap}>
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
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: USER_DOT / 2,
    backgroundColor: `${colors.green}30`,
    borderWidth: 1.5,
    borderColor: `${colors.green}70`,
  },
  dot: {
    width: USER_DOT,
    height: USER_DOT,
    borderRadius: USER_DOT / 2,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.green,
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
    gap: space[10],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[10],
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
    paddingHorizontal: space[20],
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
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    ...shadow.pop,
  },
  sheetInner: {
    paddingHorizontal: space[20],
    paddingTop: space[12],
    paddingBottom: space[8],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginBottom: space[14],
  },
  sheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
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
    marginTop: space[2],
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    backgroundColor: `${colors.green}18`,
    paddingHorizontal: space[10],
    paddingVertical: space[6],
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
    gap: space[12],
    marginBottom: space[20],
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
    backgroundColor: colors.greenDark,
    borderRadius: radius.sm,
    paddingBottom: 4,
  },
  btnInner: {
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: space[14],
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
    maxHeight: 200,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.hairline,
    marginVertical: space[8],
  },
  nearbyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[10],
  },
  nearbyMeta: {
    flex: 1,
  },
  nearbyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
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
    marginTop: space[2],
  },
  newTag: {
    backgroundColor: `${colors.sun}30`,
    paddingHorizontal: space[8],
    paddingVertical: space[2],
    borderRadius: radius.pill,
  },
  newTagText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.earth,
    letterSpacing: 0.5,
  },
})
