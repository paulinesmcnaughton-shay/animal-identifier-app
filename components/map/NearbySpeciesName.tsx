import { StyleSheet, Text, type TextStyle } from 'react-native'

import {
  isNearbySpeciesNameTruncated,
  truncateNearbySpeciesName,
} from '@/features/map/nearby-species-name-label'
import { type as typeTokens } from '@/design/tokens'

interface NearbySpeciesNameProps {
  name: string
  style?: TextStyle
}

export function NearbySpeciesName({ name, style }: NearbySpeciesNameProps) {
  const trimmed = name.trim()
  const visible = truncateNearbySpeciesName(trimmed)
  const isTruncated = isNearbySpeciesNameTruncated(trimmed)

  return (
    <Text
      style={[styles.name, style]}
      numberOfLines={1}
      ellipsizeMode="tail"
      accessibilityLabel={isTruncated ? trimmed : undefined}>
      {visible}
    </Text>
  )
}

const styles = StyleSheet.create({
  name: {
    flexShrink: 1,
    flex: 1,
    minWidth: 0,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
  },
})
