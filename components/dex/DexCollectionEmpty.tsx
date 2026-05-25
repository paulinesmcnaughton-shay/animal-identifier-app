import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

export function DexCollectionEmpty() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Nothing spotted yet — head outside!</Text>
      <Text style={styles.body}>Your first find will show up here in your Wild Dex.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: space[24],
    paddingHorizontal: space[16],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    gap: space[8],
    alignItems: 'center',
  },
  title: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
    lineHeight: 20,
  },
})
