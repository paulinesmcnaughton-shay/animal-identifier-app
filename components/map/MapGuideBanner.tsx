import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { formatDistance, type DistanceUnit } from '@/features/settings/distance-unit'

interface MapGuideBannerProps {
  speciesName: string
  distanceM: number
  distanceUnit: DistanceUnit
  arrowRotationDeg: number
  instruction: string
  isRouteLoading: boolean
  isWalkingRoute: boolean
  onEndGuide: () => void
  onRefit: () => void
}

export function MapGuideBanner({
  speciesName,
  distanceM,
  distanceUnit,
  arrowRotationDeg,
  instruction,
  isRouteLoading,
  isWalkingRoute,
  onEndGuide,
  onRefit,
}: MapGuideBannerProps) {
  const distanceLabel = isRouteLoading
    ? 'Planning walk…'
    : formatDistance(distanceM, distanceUnit)

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Stop guiding"
          onPress={onEndGuide}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="close" size={20} color={colors.ink2} />
        </Pressable>

        <View style={styles.arrowWrap}>
          <View style={[styles.arrowRotate, { transform: [{ rotate: `${arrowRotationDeg}deg` }] }]}>
            <Ionicons name="navigate" size={28} color={colors.greenLight} />
          </View>
        </View>

        <View style={styles.textCol}>
          <Text style={styles.distance} numberOfLines={1}>
            {distanceLabel}
          </Text>
          <Text style={styles.instruction} numberOfLines={2}>
            {isRouteLoading ? 'Finding a walking path…' : instruction}
          </Text>
          <Text style={styles.hint} numberOfLines={1}>
            {isWalkingRoute ? 'Walking route' : 'Direct path'} · {speciesName}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fit map to route"
          onPress={onRefit}
          hitSlop={10}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}>
          <Ionicons name="scan-outline" size={20} color={colors.green} />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: space[16],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingVertical: space[8],
    paddingHorizontal: space[16],
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow.card,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  arrowWrap: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowRotate: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    gap: space[4],
  },
  distance: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  instruction: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  hint: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
})
