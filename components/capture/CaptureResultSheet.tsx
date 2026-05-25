import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import ReAnimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

import { ProgressBar } from '@/components/ProgressBar'
import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import type { IdentResult } from '@/features/identify/types'
import { createSheetPanGesture, SHEET_SPRING } from '@/lib/draggable-sheet'

export type CaptureResultSheetPhase = 'hidden' | 'loading' | 'success' | 'error' | 'manual'

const OFF_SCREEN_Y = 400

interface CaptureResultSheetProps {
  phase: CaptureResultSheetPhase
  result: IdentResult | null
  errorMessage: string | null
  manualHint?: string
  bottomInset: number
  isSavingCollection?: boolean
  onAddToCollection: () => void
  onChooseSpecies: () => void
  onRetake: () => void
  onRetry?: () => void
}

export function CaptureResultSheet({
  phase,
  result,
  errorMessage,
  manualHint,
  bottomInset,
  isSavingCollection = false,
  onAddToCollection,
  onChooseSpecies,
  onRetake,
  onRetry,
}: CaptureResultSheetProps) {
  const translateY = useSharedValue(OFF_SCREEN_Y)
  const dragStartY = useSharedValue(0)

  const finishRetake = useCallback(() => {
    onRetake()
  }, [onRetake])

  const handleRetakePress = useCallback(() => {
    cancelAnimation(translateY)
    finishRetake()
  }, [finishRetake, translateY])

  useEffect(() => {
    if (phase === 'hidden' || phase === 'loading') {
      cancelAnimation(translateY)
      translateY.value = OFF_SCREEN_Y
      return
    }
    translateY.value = withSpring(0, SHEET_SPRING)
  }, [phase, translateY])

  const panGesture = createSheetPanGesture({
    translateY,
    dragStartY,
    enabled: phase !== 'loading' && phase !== 'hidden',
    minY: 0,
    maxY: OFF_SCREEN_Y,
    restY: 0,
    dismissY: OFF_SCREEN_Y,
    onDismiss: finishRetake,
  })

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  if (phase === 'hidden') return null

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0
  const showLowConfidenceHint = result != null && result.confidence < 0.7
  const showRetakeControl = phase !== 'loading'

  return (
    <GestureDetector gesture={panGesture}>
      <ReAnimated.View
        style={[
          styles.card,
          { paddingBottom: bottomInset + space[16] },
          cardAnimatedStyle,
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.headerSide} />
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {showRetakeControl ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Retake photo"
              onPress={handleRetakePress}
              style={({ pressed }) => [styles.retakeButton, pressed && styles.retakeButtonPressed]}>
              <Ionicons name="camera-reverse-outline" size={22} color={colors.ink2} />
            </Pressable>
          ) : (
            <View style={styles.headerSide} />
          )}
        </View>

        {phase === 'error' ? (
          <>
            <Text style={styles.speciesName}>Couldn't identify</Text>
            <Text style={styles.errorBody}>
              {errorMessage ?? 'Try a clearer angle or better lighting.'}
            </Text>
            <PopButton label="Try again" onPress={onRetry ?? onRetake} />
          </>
        ) : null}

        {phase === 'manual' ? (
          <>
            <Text style={styles.speciesName}>Not sure yet</Text>
            <Text style={styles.errorBody}>
              {manualHint ?? "We couldn't lock this one in. Pick the species that looks right."}
            </Text>
            <PopButton label="Choose species" onPress={onChooseSpecies} />
          </>
        ) : null}

        {phase === 'success' && result ? (
          <>
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

            {showLowConfidenceHint ? (
              <Text style={styles.lowConfidenceHint}>
                Not sure? You can pick a different species below.
              </Text>
            ) : null}

            <PopButton
              label={isSavingCollection ? 'Saving…' : 'Add to collection'}
              onPress={onAddToCollection}
              disabled={isSavingCollection}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Not the right species"
              onPress={onChooseSpecies}
              style={styles.secondaryAction}>
              <Text style={styles.secondaryActionText}>Not quite — choose species</Text>
            </Pressable>
          </>
        ) : null}
      </ReAnimated.View>
    </GestureDetector>
  )
}

interface PopButtonProps {
  label: string
  onPress: () => void
  disabled?: boolean
}

function PopButton({ label, onPress, disabled }: PopButtonProps) {
  return (
    <View style={[styles.popWrap, styles.fullWidth]}>
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
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 20,
    ...slideUpSheetShell(),
    paddingHorizontal: space[16],
    paddingTop: space[16],
  },
  fullWidth: {
    alignSelf: 'stretch',
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: space[16],
  },
  headerSide: {
    width: 44,
    height: 44,
  },
  handleWrap: {
    flex: 1,
    alignItems: 'center',
  },
  handle: slideUpSheetHandle,
  retakeButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  retakeButtonPressed: {
    opacity: 0.85,
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
  lowConfidenceHint: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
    lineHeight: 20,
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
    alignSelf: 'stretch',
  },
  secondaryAction: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: space[16],
    marginTop: space[8],
  },
  secondaryActionText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  popWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  popButton: {
    alignSelf: 'stretch',
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
