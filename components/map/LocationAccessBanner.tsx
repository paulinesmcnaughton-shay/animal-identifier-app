import { Ionicons } from '@expo/vector-icons'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

export type LocationAccessBannerMode = 'locating' | 'denied'

interface LocationAccessBannerProps {
  mode: LocationAccessBannerMode
  onEnableLocation: () => void
}

export function LocationAccessBanner({ mode, onEnableLocation }: LocationAccessBannerProps) {
  const isDenied = mode === 'denied'

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Ionicons name="location" size={24} color={colors.earth} />
      </View>

      <Text style={styles.title}>
        {isDenied ? 'Turn on location' : 'Finding you on the map'}
      </Text>
      <Text style={styles.sub}>
        {isDenied
          ? 'WildKind shows wildlife near you. Enable location so the map centers on where you are.'
          : 'Hang tight while we get your GPS fix.'}
      </Text>

      {isDenied ? (
        <View style={styles.ctaShadow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Enable location"
            onPress={onEnableLocation}
            style={({ pressed }) => [styles.ctaInner, pressed && styles.ctaPressed]}>
            <Ionicons name="navigate" size={18} color={colors.card} />
            <Text style={styles.ctaLabel}>Enable location</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={colors.greenLight} />
          <Text style={styles.loadingLabel}>Locating…</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: space[16],
    gap: space[8],
    alignItems: 'center',
    ...shadow.card,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.earthLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[4],
  },
  title: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  sub: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: space[4],
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[8],
  },
  loadingLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
  },
  ctaShadow: {
    alignSelf: 'stretch',
    backgroundColor: colors.greenDeep,
    borderRadius: radius.sm,
    paddingBottom: 4,
    marginTop: space[4],
  },
  ctaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: space[16],
    paddingHorizontal: space[16],
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
  },
  ctaLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
})
