import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const MOCK_RESULT = {
  commonName: 'Buff-tailed Bumblebee',
  kingdom: 'Insect',
  confidence: 0.87,
}

export function ResultScreen() {
  const insets = useSafeAreaInsets()
  const { uri } = useLocalSearchParams<{ uri?: string }>()
  const photoUri = typeof uri === 'string' ? uri : undefined

  const cardOffset = useSharedValue(320)

  useEffect(() => {
    cardOffset.value = withSpring(0, { damping: 22, stiffness: 180 })
  }, [cardOffset])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset.value }],
  }))

  const handleClose = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/home')
  }

  const handleAddToCollection = () => {
    router.replace('/(tabs)/dex')
  }

  const confidencePercent = Math.round(MOCK_RESULT.confidence * 100)

  return (
    <View style={styles.root}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.photoFallback]} />
      )}

      <View style={[styles.topOverlay, { paddingTop: insets.top + space[8] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <Ionicons name="close" size={22} color={colors.card} />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="View in 3D"
          onPress={() => {}}
          style={({ pressed }) => [styles.view3dButton, pressed && styles.pressed]}>
          <Text style={styles.view3dText}>View in 3D</Text>
        </Pressable>
      </View>

      <Animated.View
        style={[
          styles.card,
          { paddingBottom: insets.bottom + space[20] },
          cardAnimatedStyle,
        ]}>
        <View style={styles.handle} />
        <Text style={styles.speciesName}>{MOCK_RESULT.commonName}</Text>
        <View style={styles.metaRow}>
          <KingdomBadge label={MOCK_RESULT.kingdom} />
          <Text style={styles.confidence}>{confidencePercent}% match</Text>
        </View>
        <PopButton label="Add to collection" onPress={handleAddToCollection} />
      </Animated.View>
    </View>
  )
}

interface PopButtonProps {
  label: string
  onPress: () => void
}

function PopButton({ label, onPress }: PopButtonProps) {
  return (
    <View style={styles.popWrap}>
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [styles.popButton, pressed && styles.popPressed]}>
        <Text style={styles.popLabel}>{label}</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  photoFallback: {
    backgroundColor: colors.ink2,
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(21,33,48,0.45)',
  },
  view3dButton: {
    minHeight: 44,
    paddingHorizontal: space[14],
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.plum,
  },
  view3dText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  pressed: {
    opacity: 0.88,
  },
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingHorizontal: space[20],
    paddingTop: space[12],
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    marginBottom: space[16],
  },
  speciesName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.6,
    marginBottom: space[12],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space[20],
  },
  confidence: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  popWrap: {
    backgroundColor: colors.greenDark,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  popButton: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  popPressed: {
    transform: [{ translateY: 2 }],
  },
  popLabel: {
    color: colors.card,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
  },
})
