import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

// Design-spec gradients (multi-stop; not single-value tokens).
const VENUE_GRADIENT = ['#FFB347', '#F6883F', '#EE6B4D'] as const
const TILE_GRADIENT = ['#FFFFFF', '#FFF1DC'] as const

export function ExploreVenuesCard() {
  const router = useRouter()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Explore venues"
      onPress={() => router.push('/venues')}
      style={({ pressed }) => [styles.wrap, pressed && styles.pressed]}>
      <LinearGradient
        colors={VENUE_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}>
        <LinearGradient
          colors={TILE_GRADIENT}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.tile}>
          <Text style={styles.giraffe}>🦒</Text>
        </LinearGradient>
        <View style={styles.text}>
          <Text style={styles.title}>Explore venues</Text>
          <Text style={styles.sub}>Zoos · Aquariums · Safari parks</Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.flame} />
        </View>
      </LinearGradient>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {},
  pressed: {
    transform: [{ translateY: 2 }],
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    borderRadius: radius.xl,
    padding: space[16],
    shadowColor: '#EE6B4D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 20,
    elevation: 8,
  },
  tile: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: space[4],
  },
  giraffe: {
    fontSize: 31,
  },
  text: {
    flex: 1,
  },
  title: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  sub: {
    marginTop: space[4],
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: 'rgba(255,255,255,0.85)',
  },
  chevron: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
