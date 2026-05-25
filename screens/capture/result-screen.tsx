import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import type { IdentifySource } from '@/features/identify/types'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native'
import ReAnimated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { ProgressBar } from '@/components/ProgressBar'
import { contentTopInset } from '@/design/screen-layout'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { slugifySpeciesName } from '@/data/species-catalog'
import { identifyAnimalOrPlant } from '@/features/identify/identify-image'
import { buildManualPickerRouteParams } from '@/features/identify/manual-picker-params'
import { friendlyIdentifyError } from '@/features/identify/friendly-identify-error'
import type { IdentResult } from '@/features/identify/types'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { saveUserSighting } from '@/features/sightings/save-user-sighting'

export function ResultScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    uri?: string
    identified?: string
    commonName?: string
    kingdom?: string
    confidence?: string
    source?: string
    errorMessage?: string
  }>()
  const photoUri = typeof params.uri === 'string' ? params.uri : undefined

  const prefilledResult: IdentResult | null =
    params.identified === '1' && typeof params.commonName === 'string'
      ? {
          commonName: params.commonName,
          kingdom:
            typeof params.kingdom === 'string' && params.kingdom.length > 0
              ? (params.kingdom as IdentResult['kingdom'])
              : null,
          confidence: Number(params.confidence) || 0,
          source: (params.source as IdentifySource) || 'inaturalist',
        }
      : null
  const prefilledError =
    typeof params.errorMessage === 'string' && params.errorMessage.length > 0
      ? params.errorMessage
      : null

  const [isLoading, setIsLoading] = useState(!!photoUri && !prefilledResult && !prefilledError)
  const [result, setResult] = useState<IdentResult | null>(prefilledResult)
  const [errorMessage, setErrorMessage] = useState<string | null>(prefilledError)
  const [isSaving, setIsSaving] = useState(false)

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
      const outcome = await identifyAnimalOrPlant(imageUri)
      if (outcome.status === 'manual') {
        router.replace({
          pathname: '/identify/manual-picker',
          params: buildManualPickerRouteParams({ ...outcome, uri: imageUri }),
        })
        return
      }
      setResult(outcome.result)
    } catch (error) {
      setErrorMessage(friendlyIdentifyError(error))
      if (__DEV__) console.warn('[WildKind iNat]', error)
    } finally {
      pulse.stop()
      pulseAnim.setValue(1)
      setIsLoading(false)
    }
  }, [pulseAnim])

  useEffect(() => {
    if (!photoUri || prefilledResult || prefilledError) return
    void runIdentification(photoUri)
  }, [photoUri, prefilledResult, prefilledError, runIdentification])

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
    if (router.canDismiss()) router.dismiss(1)
    else router.replace('/capture/scan')
  }

  const handleAddToCollection = async () => {
    if (!result) {
      router.replace('/(tabs)/dex')
      return
    }

    const speciesId = result.lookupId ?? slugifySpeciesName(result.commonName)
    const kingdom = (result.kingdom ?? 'mammal') as KingdomKey

    setIsSaving(true)
    const saveResult = await saveUserSighting({
      speciesId,
      speciesName: result.commonName,
      kingdom,
      latinName: result.latinName,
      dexNumber: result.dexNumber,
      confidence: result.confidence,
      isDomestic: result.isDomestic,
      photoUri: photoUri,
    })
    setIsSaving(false)

    if (!saveResult.ok) {
      Alert.alert(
        'Could not save',
        saveResult.errorMessage ?? 'Sign in to add finds to your collection.',
      )
      return
    }

    router.replace({
      pathname: '/species/[id]',
      params: {
        id: speciesId,
        name: result.commonName,
        kingdom,
        number: result.dexNumber ?? '',
        confidence: String(result.confidence),
        ...(result.latinName ? { latin: result.latinName } : {}),
        ...(result.isDomestic ? { domestic: '1' } : {}),
        fromCapture: '1',
        saved: '1',
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

      <View style={[styles.topOverlay, { paddingTop: contentTopInset(insets.top) }]}>
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
            { paddingBottom: insets.bottom + space[16] },
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
            { paddingBottom: insets.bottom + space[16] },
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
          <PopButton
            label={isSaving ? 'Saving…' : 'Add to collection'}
            onPress={() => void handleAddToCollection()}
            disabled={isSaving}
          />
        </ReAnimated.View>
      ) : null}
    </View>
  )
}

interface PopButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
}

function PopButton({ label, onPress, disabled }: PopButtonProps) {
  return (
    <View style={styles.popWrap}>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.popButton,
          pressed && !disabled && styles.popPressed,
          disabled && styles.popDisabled,
        ]}>
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
    paddingHorizontal: space[16],
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
    ...slideUpSheetShell(),
    paddingHorizontal: space[16],
    paddingTop: space[16],
  },
  handle: {
    ...slideUpSheetHandle,
    marginBottom: space[16],
  },
  speciesName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.6,
    marginBottom: space[16],
  },
  errorBody: {
    fontSize: typeTokens.size.body,
    color: colors.ink2,
    lineHeight: 22,
    marginBottom: space[16],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: space[16],
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
    marginBottom: space[16],
  },
  secondaryAction: {
    alignItems: 'center',
    paddingVertical: space[16],
    marginTop: space[8],
  },
  secondaryActionText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  popWrap: {
    backgroundColor: colors.greenDeep,
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
  popDisabled: {
    opacity: 0.6,
  },
  popLabel: {
    color: colors.card,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
  },
})
