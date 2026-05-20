import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

interface SpeciesCardProps {
  name: string
  subtitle?: string
}

export function SpeciesCard({ name, subtitle }: SpeciesCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.name}>{name}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: space[16],
    borderRadius: radius.md,
    backgroundColor: colors.card,
    ...shadow.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  name: {
    fontSize: typeTokens.size.body,
    fontWeight: '700',
    color: colors.ink,
  },
  sub: {
    marginTop: space[4],
    fontSize: typeTokens.size.caption,
    color: colors.dim,
  },
})
