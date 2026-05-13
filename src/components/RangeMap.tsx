import { StyleSheet, Text, View } from 'react-native'

import { colors, type as typeTokens } from '@/src/design/tokens'

export function RangeMap() {
  return (
    <View style={styles.box} accessibilityLabel="Range map placeholder">
      <Text style={styles.caption}>Range map</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  box: {
    height: 120,
    borderRadius: 12,
    backgroundColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    fontSize: typeTokens.size.caption,
    color: colors.dim,
  },
})
