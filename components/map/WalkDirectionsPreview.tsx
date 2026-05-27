import { Ionicons } from '@expo/vector-icons'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'

import {
  WALK_DIRECTIONS_GAP,
  WALK_DIRECTIONS_GAP_BLOCK,
  WALK_DIRECTIONS_ICON,
  WALK_DIRECTIONS_TOUCH,
  walkDirectionsHitSlop,
  walkDirectionsIconButton,
} from '@/components/map/walk-directions-layout'
import {
  MAP_SHEET_HEADER_ROW_MIN_HEIGHT,
  MAP_SHEET_SCROLL_TOP_PADDING,
  mapSheetTextStyles,
} from '@/features/map/map-sheet-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import type { WalkingRouteStep } from '@/features/map/fetch-walking-route'
import { formatWalkDurationLabel } from '@/features/map/walking-guide-nav'
import type { WalkRouteSummary } from '@/features/map/use-walking-guide'
import { formatDistance, type DistanceUnit } from '@/features/settings/distance-unit'

interface WalkDirectionsPreviewProps {
  speciesName: string
  routeSummary: WalkRouteSummary | null
  routeSteps: WalkingRouteStep[]
  isRouteLoading: boolean
  routeFailed: boolean
  distanceUnit: DistanceUnit
  scrollEnabled?: boolean
  onExit: () => void
}

export function WalkDirectionsPreview({
  speciesName,
  routeSummary,
  routeSteps,
  isRouteLoading,
  routeFailed,
  distanceUnit,
  scrollEnabled = true,
  onExit,
}: WalkDirectionsPreviewProps) {
  const durationLabel = routeSummary
    ? formatWalkDurationLabel(routeSummary.durationSec)
    : '—'
  const distanceLabel = routeSummary
    ? formatDistance(routeSummary.distanceM, distanceUnit)
    : '—'

  const showSteps = routeSteps.length > 0 && !isRouteLoading

  const bodyContent = (
    <>
      <Text style={styles.speciesName} numberOfLines={2}>
        {speciesName}
      </Text>

      {isRouteLoading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.green} />
          <Text style={styles.loadingText}>Planning your walking route…</Text>
        </View>
      ) : (
        <View style={styles.summaryBlock}>
          <Text style={styles.duration}>{durationLabel}</Text>
          <Text style={styles.meta}>
            {distanceLabel}
            {routeSummary?.isWalkingRoute ? ' · Sidewalk route' : ' · Direct path'}
            {routeFailed ? ' · Using fallback path' : ''}
          </Text>
        </View>
      )}

      {showSteps ? (
        <View style={styles.stepsBlock}>
          <Text style={styles.stepsHeading}>Directions</Text>
          {routeSteps.map((step, index) => (
            <View key={`${step.maneuverType}-${index}`} style={styles.stepRow}>
              <View style={styles.stepIndex}>
                <Text style={styles.stepIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepInstruction}>{step.instruction}</Text>
                {step.distanceM > 0 ? (
                  <Text style={styles.stepDistance}>
                    {formatDistance(step.distanceM, distanceUnit)}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </>
  )

  return (
    <View style={styles.root}>
      <View style={styles.headerChrome}>
        <View style={styles.header}>
          <View style={styles.headerMain}>
            <Ionicons name="walk" size={WALK_DIRECTIONS_ICON.walk} color={colors.skyDeep} />
            <Text style={styles.headerTitle} numberOfLines={1}>
              Walk to spot
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit directions"
            onPress={onExit}
            hitSlop={walkDirectionsHitSlop}
            style={({ pressed }) => [
              walkDirectionsIconButton.base,
              walkDirectionsIconButton.onLight,
              pressed && styles.pressed,
            ]}>
            <Ionicons name="close" size={WALK_DIRECTIONS_ICON.close} color={colors.green} />
          </Pressable>
        </View>
      </View>

      {scrollEnabled ? (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          scrollEnabled
          showsVerticalScrollIndicator={false}
          bounces>
          {bodyContent}
        </ScrollView>
      ) : (
        <View style={[styles.scroll, styles.scrollContent]}>{bodyContent}</View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
  },
  headerChrome: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    zIndex: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: MAP_SHEET_HEADER_ROW_MIN_HEIGHT,
    marginBottom: space[8],
    gap: WALK_DIRECTIONS_GAP_BLOCK,
  },
  headerMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: WALK_DIRECTIONS_GAP,
    minWidth: 0,
  },
  headerTitle: {
    flex: 1,
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  pressed: {
    opacity: 0.7,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    paddingTop: MAP_SHEET_SCROLL_TOP_PADDING,
    paddingBottom: WALK_DIRECTIONS_GAP_BLOCK,
    gap: WALK_DIRECTIONS_GAP,
  },
  speciesName: {
    ...mapSheetTextStyles.speciesName,
  },
  summaryBlock: {
    gap: WALK_DIRECTIONS_GAP,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WALK_DIRECTIONS_GAP,
    paddingVertical: WALK_DIRECTIONS_GAP,
  },
  loadingText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
  },
  duration: {
    ...mapSheetTextStyles.duration,
  },
  meta: {
    ...mapSheetTextStyles.meta,
  },
  stepsBlock: {
    gap: WALK_DIRECTIONS_GAP,
    paddingTop: WALK_DIRECTIONS_GAP,
  },
  stepsHeading: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: WALK_DIRECTIONS_GAP_BLOCK,
    marginBottom: WALK_DIRECTIONS_GAP,
  },
  stepIndex: {
    width: WALK_DIRECTIONS_TOUCH,
    height: WALK_DIRECTIONS_TOUCH,
    borderRadius: radius.pill,
    backgroundColor: colors.bg2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIndexText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
    paddingTop: WALK_DIRECTIONS_GAP,
  },
  stepInstruction: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
    marginBottom: WALK_DIRECTIONS_GAP,
  },
  stepDistance: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
})
