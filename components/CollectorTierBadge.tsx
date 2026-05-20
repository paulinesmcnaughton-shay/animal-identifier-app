import { Image } from 'expo-image'
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native'

import {
  badgeImageForTier,
  tierForCaptureCount,
  type CollectorTier,
} from '@/lib/collector-tier'

interface CollectorTierBadgeProps {
  captureCount: number
  size?: number
  tier?: CollectorTier
  style?: StyleProp<ViewStyle>
}

export function CollectorTierBadge({
  captureCount,
  size = 52,
  tier: tierOverride,
  style,
}: CollectorTierBadgeProps) {
  const tier = tierOverride ?? tierForCaptureCount(captureCount)
  const source = badgeImageForTier(tier)

  return (
    <View style={[styles.wrap, { width: size, height: size }, style]}>
      <Image
        source={source}
        style={{ width: size, height: size }}
        contentFit="contain"
        accessibilityLabel={`${tier} collector badge`}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
})
