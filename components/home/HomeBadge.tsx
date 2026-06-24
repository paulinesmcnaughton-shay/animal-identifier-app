import { useFocusEffect } from '@react-navigation/native'
import { Image } from 'expo-image'
import { useCallback, useState } from 'react'
import { StyleSheet, View } from 'react-native'

import { BADGES } from '@/data/badges'
import { colors } from '@/design/tokens'
import { getNewlyEarnedCount, topEarnedBadge } from '@/features/achievements/badge-progress'

const FALLBACK_BADGE = BADGES.find((b) => b.id === 'first-sighting') ?? BADGES[0]

interface HomeBadgeProps {
  spotsCaptured: number
  streakDays: number
  size?: number
}

export function HomeBadge({ spotsCaptured, streakDays, size = 52 }: HomeBadgeProps) {
  const earned = topEarnedBadge({ spotsCaptured, streakDays })
  const badge = earned ?? FALLBACK_BADGE
  const [hasNew, setHasNew] = useState(false)

  // Re-check on focus so the highlight clears after the user views the Badges screen.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      void getNewlyEarnedCount({ spotsCaptured, streakDays }).then((n) => {
        if (!cancelled) setHasNew(n > 0)
      })
      return () => {
        cancelled = true
      }
    }, [spotsCaptured, streakDays]),
  )

  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        hasNew && styles.highlight,
      ]}>
      <Image
        source={badge.image}
        style={{ width: size, height: size, opacity: earned ? 1 : 0.4 }}
        contentFit="contain"
      />
      {hasNew ? <View style={styles.dot} /> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlight: {
    borderWidth: 2.5,
    borderColor: colors.sun,
    shadowColor: colors.sun,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  dot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.coral,
    borderWidth: 2,
    borderColor: colors.bg,
  },
})
