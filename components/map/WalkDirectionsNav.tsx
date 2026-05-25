import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  WALK_DIRECTIONS_EDGE,
  WALK_DIRECTIONS_GAP,
  WALK_DIRECTIONS_GAP_BLOCK,
  WALK_DIRECTIONS_ICON,
  WALK_DIRECTIONS_TOUCH,
  walkDirectionsHitSlop,
  walkDirectionsIconButton,
} from '@/components/map/walk-directions-layout'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import {
  formatWalkDurationLabel,
  maneuverIconName,
} from '@/features/map/walking-guide-nav'
import { formatDistance, type DistanceUnit } from '@/features/settings/distance-unit'

interface WalkDirectionsNavProps {
  speciesName: string
  instruction: string
  distanceRemainingM: number
  durationRemainingSec: number | null
  distanceUnit: DistanceUnit
  maneuverModifier: string | null
  maneuverType: string
  onExit: () => void
  onRecenter: () => void
}

export function WalkDirectionsNav({
  speciesName,
  instruction,
  distanceRemainingM,
  durationRemainingSec,
  distanceUnit,
  maneuverModifier,
  maneuverType,
  onExit,
  onRecenter,
}: WalkDirectionsNavProps) {
  const insets = useSafeAreaInsets()
  const iconName = maneuverIconName(maneuverModifier, maneuverType)
  const timeLabel =
    durationRemainingSec != null
      ? formatWalkDurationLabel(durationRemainingSec)
      : formatDistance(distanceRemainingM, distanceUnit)

  const recenterBottom = insets.bottom + TAB_BAR_CLEARANCE + WALK_DIRECTIONS_GAP + WALK_DIRECTIONS_TOUCH + WALK_DIRECTIONS_GAP_BLOCK * 3

  return (
    <>
      <View
        style={[styles.topWrap, { paddingTop: insets.top + WALK_DIRECTIONS_GAP }]}
        pointerEvents="box-none">
        <View style={styles.instructionCard}>
          <View style={walkDirectionsIconButton.maneuver}>
            <Ionicons
              name={iconName as ComponentProps<typeof Ionicons>['name']}
              size={WALK_DIRECTIONS_ICON.maneuver}
              color={colors.card}
            />
          </View>
          <View style={styles.instructionText}>
            <Text style={styles.instruction} numberOfLines={3}>
              {instruction}
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {formatDistance(distanceRemainingM, distanceUnit)} to {speciesName}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Re-center map on your location"
        onPress={onRecenter}
        hitSlop={walkDirectionsHitSlop}
        style={({ pressed }) => [
          styles.recenterBtn,
          { bottom: recenterBottom },
          pressed && styles.pressed,
        ]}>
        <View style={styles.recenterIconWrap}>
          <Ionicons name="locate" size={WALK_DIRECTIONS_ICON.recenter} color={colors.green} />
        </View>
        <Text style={styles.recenterLabel}>Re-center</Text>
      </Pressable>

      <View
        style={[styles.bottomWrap, { paddingBottom: insets.bottom + TAB_BAR_CLEARANCE + WALK_DIRECTIONS_GAP }]}
        pointerEvents="box-none">
        <View style={styles.bottomBar}>
          <View style={styles.etaCol}>
            <Text style={styles.etaTime}>{timeLabel}</Text>
            <Text style={styles.etaMeta}>Walking</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Exit walking directions"
            onPress={onExit}
            hitSlop={walkDirectionsHitSlop}
            style={({ pressed }) => [styles.exitBtn, pressed && styles.pressed]}>
            <Text style={styles.exitLabel}>Exit</Text>
          </Pressable>
        </View>
      </View>
    </>
  )
}

const TAB_BAR_CLEARANCE = 60

const styles = StyleSheet.create({
  topWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: WALK_DIRECTIONS_EDGE,
    zIndex: 20,
  },
  instructionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: WALK_DIRECTIONS_GAP_BLOCK,
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: WALK_DIRECTIONS_GAP_BLOCK,
    paddingHorizontal: WALK_DIRECTIONS_GAP_BLOCK,
    ...shadow.card,
  },
  instructionText: {
    flex: 1,
    minWidth: 0,
    gap: WALK_DIRECTIONS_GAP,
  },
  instruction: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodyLG,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  subtitle: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: 'rgba(255, 255, 255, 0.78)',
  },
  recenterBtn: {
    position: 'absolute',
    left: WALK_DIRECTIONS_EDGE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: WALK_DIRECTIONS_GAP,
    backgroundColor: colors.card,
    padding: WALK_DIRECTIONS_GAP_BLOCK,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.hairline,
    zIndex: 20,
    ...shadow.card,
  },
  recenterIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  recenterLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  bottomWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: WALK_DIRECTIONS_EDGE,
    zIndex: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: WALK_DIRECTIONS_GAP_BLOCK,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: WALK_DIRECTIONS_GAP_BLOCK,
    paddingHorizontal: WALK_DIRECTIONS_GAP_BLOCK,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.pop,
  },
  etaCol: {
    flex: 1,
    minWidth: 0,
    gap: WALK_DIRECTIONS_GAP,
  },
  etaTime: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  etaMeta: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
  exitBtn: {
    backgroundColor: colors.coral,
    paddingHorizontal: space[24],
    paddingVertical: WALK_DIRECTIONS_GAP_BLOCK,
    borderRadius: radius.md,
    minHeight: WALK_DIRECTIONS_TOUCH,
    minWidth: 96,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: 16,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  pressed: {
    opacity: 0.85,
  },
})
