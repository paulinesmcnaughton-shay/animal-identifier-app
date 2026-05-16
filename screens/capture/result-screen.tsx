import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const ICONIC_TAXON_MAP: Record<string, KingdomKey> = {
  Mammalia:        'mammal',
  Aves:            'bird',
  Reptilia:        'reptile',
  Amphibia:        'amphibian',
  Actinopterygii:  'fish',
  Insecta:         'insect',
  Arachnida:       'arachnid',
  Mollusca:        'mollusc',
}

interface IdentResult {
  commonName: string
  kingdom: KingdomKey
  confidence: number
}

const FALLBACK: IdentResult = {
  commonName: 'Buff-tailed Bumblebee',
  kingdom: 'insect',
  confidence: 0.87,
}

async function scoreImage(uri: string): Promise<IdentResult> {
  const token = Constants.expoConfig?.extra?.inaturalistToken as string | undefined

  const body = new FormData()
  body.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob)

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch('https://api.inaturalist.org/v1/computervision/score_image', {
    method: 'POST',
    headers,
    body,
  })

  if (!res.ok) throw new Error(`Vision API ${res.status}`)

  const json = await res.json()
  const top = json?.results?.[0]
  if (!top) throw new Error('No results')

  const commonName: string =
    top.taxon?.preferred_common_name ?? top.taxon?.name ?? 'Unknown species'
  const iconicName: string = top.taxon?.iconic_taxon_name ?? ''
  const kingdom: KingdomKey = ICONIC_TAXON_MAP[iconicName] ?? 'insect'
  const confidence: number = top.combined_score ?? 0

  return { commonName, kingdom, confidence }
}

export function ResultScreen() {
  const insets = useSafeAreaInsets()
  const { uri } = useLocalSearchParams<{ uri?: string }>()
  const photoUri = typeof uri === 'string' ? uri : undefined

  const [isLoading, setIsLoading] = useState(!!photoUri)
  const [result, setResult] = useState<IdentResult>(FALLBACK)

  const pulseAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    if (!photoUri) return

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.25, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    )
    pulse.start()

    scoreImage(photoUri)
      .then(setResult)
      .catch(() => setResult(FALLBACK))
      .finally(() => {
        pulse.stop()
        pulseAnim.setValue(1)
        setIsLoading(false)
      })

    return () => pulse.stop()
  }, [photoUri])

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
    router.replace('/(tabs)/dex')
  }

  const confidencePercent = Math.round(result.confidence * 100)

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

        {!isLoading && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="View in 3D"
            onPress={() => router.push({ pathname: '/capture/view3d', params: { name: result.commonName } })}
            style={({ pressed }) => [styles.view3dButton, pressed && styles.pressed]}>
            <Text style={styles.view3dText}>View in 3D</Text>
          </Pressable>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loadingCenter}>
          <Animated.View style={[styles.pulseOuter, { transform: [{ scale: pulseAnim }] }]} />
          <View style={styles.pulseInner} />
          <Text style={styles.loadingLabel}>Identifying…</Text>
        </View>
      ) : (
        <ReAnimated.View
          style={[
            styles.card,
            { paddingBottom: insets.bottom + space[20] },
            cardAnimatedStyle,
          ]}>
          <View style={styles.handle} />
          <Text style={styles.speciesName}>{result.commonName}</Text>

          <View style={styles.metaRow}>
            <KingdomBadge kind={result.kingdom} />
          </View>

          <View style={styles.confidenceRow}>
            <Text style={styles.confidenceLabel}>Confidence</Text>
            <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
          </View>
          <View style={styles.confidenceBar}>
            <ProgressBar progress={result.confidence} />
          </View>
          <PopButton label="Add to collection" onPress={handleAddToCollection} />
        </ReAnimated.View>
      )}
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
