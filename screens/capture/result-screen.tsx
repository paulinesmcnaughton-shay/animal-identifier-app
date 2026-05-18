import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { slugifySpeciesName } from '@/data/species-catalog'
import { identifyAnimalOrPlant } from '@/features/identify/identify-image'
import { type IdentResult, IdentifyError } from '@/features/identify/types'

export function ResultScreen() {
  const insets = useSafeAreaInsets()
  const { uri } = useLocalSearchParams<{ uri?: string }>()
  const photoUri = typeof uri === 'string' ? uri : undefined

  const [isLoading, setIsLoading] = useState(!!photoUri)
  const [result, setResult] = useState<IdentResult | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const pulseAnim = useRef(new Animated.Value(1)).current

  const runIdentification = useCallback(async (imageUri: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    setResult(null)

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    )
    pulse.start()

    try {
      const ident = await identifyAnimalOrPlant(imageUri)
      setResult(ident)
    } catch (error) {
      const message =
        error instanceof IdentifyError
          ? error.message
          : "Couldn't identify that one. Try a clearer angle."
      setErrorMessage(message)
      if (__DEV__) console.warn('[Wildr iNat]', error)
    } finally {
      pulse.stop()
      pulseAnim.setValue(1)
      setIsLoading(false)
    }
  }, [pulseAnim])

  useEffect(() => {
    if (!photoUri) return
    void runIdentification(photoUri)
  }, [photoUri, runIdentification])

  const cardOffset = useSharedValue(320)

  useEffect(() => {
    if (!isLoading) {
      cardOffset.value = withSpring(0, { damping: 22, stiffness: 180 })
    }
  }, [isLoading, cardOffset])

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardOffset.value }],
  }))

  const handleClose = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/home')
  }

  const handleAddToCollection = () => {
    if (!result) {
      router.replace('/(tabs)/dex')
      return
    }
    router.push({
      pathname: '/species/[id]',
      params: {
        id: slugifySpeciesName(result.commonName),
        name: result.commonName,
        kingdom: result.kingdom ?? 'mammal',
        confidence: String(result.confidence),
        number: '#???',
      },
    })
  }

  const handleRetry = () => {
    if (photoUri) void runIdentification(photoUri)
  }

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0

  return (
    <View style={styles.root}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.photoFallback]} />
      )}
      <View style={[StyleSheet.absoluteFill, styles.darkOverlay]} />

      <View style={[styles.topOverlay, { paddingTop: insets.top + space[8] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={handleClose}
          style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
          <Ionicons name="close" size={22} color={colors.card} />
        </Pressable>

        {!isLoading && result ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View in 3D"
            onPress={() => router.push({ pathname: '/capture/view3d', params: { name: result.commonName } })}
            style={({ pressed }) => [styles.view3dButton, pressed && styles.pressed]}>
            <Text style={styles.view3dText}>View in 3D</Text>
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulseInner} />
          <Text style={styles.loadingLabel}>Identifying…</Text>
        </View>
      ) : errorMessage ? (
        <ReAnimated.View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + space[20] },
            cardAnimatedStyle,
          ]}>
          <View style={styles.handle} />
          <Text style={styles.speciesName}>Couldn't identify</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <PopButton label="Try again" onPress={handleRetry} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retake photo"
            onPress={handleClose}
            style={styles.secondaryAction}>
            <Text style={styles.secondaryActionText}>Retake photo</Text>
          </Pressable>
        </ReAnimated.View>
      ) : result ? (
        <ReAnimated.View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + space[20] },
            cardAnimatedStyle,
          ]}>
          <View style={styles.handle} />
          <Text style={styles.speciesName}>{result.commonName}</Text>

          {result.kingdom ? (
            <View style={styles.metaRow}>
              <KingdomBadge kind={result.kingdom} />
            </View>
          ) : null}

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
          </View>
          <View style={styles.confidenceBar}>
            <ProgressBar progress={result.confidence} />
          </View>
          <PopButton label="Add to collection" onPress={handleAddToCollection} />
        </ReAnimated.View>
      ) : null}
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
  darkOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
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
  loadingCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[16],
  },
  pulseOuter: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: `${colors.green}40`,
  },
  pulseInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.green,
  },
  loadingLabel: {
    marginTop: 68,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
    letterSpacing: 0.3,
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
  errorBody: {
    fontSize: typeTokens.size.body,
    color: colors.ink2,
    lineHeight: 22,
    marginBottom: space[20],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[20],
  },
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space[8],
  },
  confidenceLabel: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  confidenceValue: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  confidenceBar: {
    marginBottom: space[20],
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: space[12],
    marginTop: space[8],
  },
  secondaryActionText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
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
