import { StyleSheet, View } from 'react-native'

import { colors } from '@/design/tokens'

/** Placeholder art region for species tiles — replace with illustrations or SVG. */
export function SpeciesArt() {
  return <View style={styles.blob} accessibilityLabel="Species illustration placeholder" />
}

const styles = StyleSheet.create({
  blob: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.sky}55`,
  },
})
