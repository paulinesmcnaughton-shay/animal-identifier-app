import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

import { colors, space } from '@/src/design/tokens'

export type OnboardingSpeciesKind = 'fox' | 'monarch' | 'frog' | 'cardinal'

interface OnboardingSpeciesArtProps {
  kind: OnboardingSpeciesKind
  size: number
  rounded: number
}

/** RN stand-in for web `SpeciesArt` — gradient tile + simple silhouette. */
export function OnboardingSpeciesArt({ kind, size, rounded }: OnboardingSpeciesArtProps) {
  const palette =
    kind === 'fox'
      ? ([colors.sun, '#FF9D5C'] as const)
      : kind === 'monarch'
        ? ([colors.sun, colors.coral] as const)
        : kind === 'frog'
          ? ([colors.lime, colors.green] as const)
          : ([colors.coralDeep, colors.coral] as const)

  return (
    <View style={[styles.wrap, { width: size, height: size, borderRadius: rounded }]}>
      <LinearGradient colors={[...palette]} style={[StyleSheet.absoluteFill, { borderRadius: rounded }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {kind === 'fox' ? (
        <FoxSilhouette />
      ) : kind === 'monarch' ? (
        <MonarchSilhouette />
      ) : kind === 'frog' ? (
        <FrogSilhouette />
      ) : (
        <CardinalSilhouette />
      )}
    </View>
  )
}

function FoxSilhouette() {
  return (
    <View style={styles.silhouette}>
      <View style={styles.center}>
        <View style={styles.foxEarL} />
        <View style={styles.foxEarR} />
        <View style={styles.foxHead} />
      </View>
    </View>
  )
}

function MonarchSilhouette() {
  return (
    <View style={styles.silhouette}>
      <View style={styles.center}>
        <View style={styles.monoWingL} />
        <View style={styles.monoWingR} />
        <View style={styles.monoBody} />
      </View>
    </View>
  )
}

function FrogSilhouette() {
  return (
    <View style={styles.silhouette}>
      <View style={styles.center}>
        <View style={styles.frogRow}>
          <View style={styles.frogEye} />
          <View style={styles.frogEye} />
        </View>
        <View style={styles.frogFace} />
      </View>
    </View>
  )
}

function CardinalSilhouette() {
  return (
    <View style={styles.silhouette}>
      <View style={styles.center}>
        <View style={styles.birdBody} />
        <View style={styles.birdBeak} />
      </View>
    </View>
  )
}

const ink = 'rgba(21,33,48,0.88)'

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    shadowColor: colors.earth,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  silhouette: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  foxHead: {
    width: 52,
    height: 44,
    borderRadius: 22,
    backgroundColor: ink,
    marginTop: 8,
  },
  foxEarL: {
    position: 'absolute',
    top: 0,
    left: '22%',
    width: 14,
    height: 18,
    borderRadius: 7,
    backgroundColor: ink,
    transform: [{ rotate: '-18deg' }],
  },
  foxEarR: {
    position: 'absolute',
    top: 0,
    right: '22%',
    width: 14,
    height: 18,
    borderRadius: 7,
    backgroundColor: ink,
    transform: [{ rotate: '18deg' }],
  },
  monoWingL: {
    position: 'absolute',
    width: 38,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(21,33,48,0.82)',
    transform: [{ rotate: '-25deg' }, { translateX: -20 }],
  },
  monoWingR: {
    position: 'absolute',
    width: 38,
    height: 52,
    borderRadius: 20,
    backgroundColor: 'rgba(21,33,48,0.82)',
    transform: [{ rotate: '25deg' }, { translateX: 20 }],
  },
  monoBody: {
    width: 14,
    height: 44,
    borderRadius: 7,
    backgroundColor: 'rgba(21,33,48,0.9)',
  },
  frogRow: {
    flexDirection: 'row',
    gap: space[14],
    marginBottom: space[4],
  },
  frogEye: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ink,
  },
  frogFace: {
    width: 56,
    height: 40,
    borderRadius: 22,
    backgroundColor: ink,
  },
  birdBody: {
    width: 56,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(21,33,48,0.92)',
  },
  birdBeak: {
    marginTop: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderTopWidth: 14,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.sun,
  },
})
