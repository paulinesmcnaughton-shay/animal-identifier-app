import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

// Design-spec gradients (multi-stop; not single-value tokens).
const VENUE_GRADIENT = ['#FFB347', '#F6883F', '#EE6B4D'] as const
const TILE_GRADIENT = ['#FFFFFF', '#FFF1DC'] as const

export function ExploreVenuesCard() {
  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Explore venues — coming soon"
      style={styles.wrap}>
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
          <View style={styles.sunHalo} />
          <View style={styles.sun} />
          <View style={styles.ground} />
          <Text style={styles.giraffe}>🦒</Text>
        </LinearGradient>
        <View style={styles.text}>
          <Text style={styles.title}>Explore venues</Text>
          <Text style={styles.sub}>Zoos · Aquariums · Safari parks</Text>
        </View>
        <View style={styles.comingSoon}>
          <Text style={styles.comingSoonText}>COMING{'\n'}SOON</Text>
        </View>
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {},
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
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  sunHalo: {
    position: 'absolute',
    top: 4,
    right: 5,
    width: 23,
    height: 23,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,238,180,0.55)',
  },
  sun: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 15,
    height: 15,
    borderRadius: radius.pill,
    backgroundColor: '#FFD36B',
  },
  ground: {
    position: 'absolute',
    left: -6,
    right: -6,
    bottom: -8,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: '#9C6B2E',
    opacity: 0.45,
  },
  giraffe: {
    fontSize: 31,
    marginBottom: 3,
    textShadowColor: 'rgba(120,60,20,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 2,
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
  comingSoon: {
    alignSelf: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  comingSoonText: {
    fontSize: 9,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 0.8,
    lineHeight: 11,
    textAlign: 'center',
    color: colors.coralDeep,
  },
})
