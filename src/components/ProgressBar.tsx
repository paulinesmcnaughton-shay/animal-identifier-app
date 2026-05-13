import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'

import { colors, radius } from '@/src/design/tokens'

interface ProgressBarProps {
  progress: number
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const clamped = Math.min(1, Math.max(0, progress))

  return (
    <View style={styles.track} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: clamped * 100 }}>
      <View style={[styles.fillWrap, { width: `${clamped * 100}%` }]}>
        <LinearGradient
          colors={[colors.lime, colors.green]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.fill}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  fillWrap: {
    height: '100%',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  fill: {
    flex: 1,
    borderRadius: radius.pill,
  },
})
