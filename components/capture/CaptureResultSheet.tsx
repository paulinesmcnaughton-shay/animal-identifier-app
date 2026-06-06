import { Ionicons } from '@expo/vector-icons'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import ReAnimated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { ProgressBar } from '@/components/ProgressBar'
import { KingdomBadge } from '@/design/atoms/KingdomBadge'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import type { IdentResult } from '@/features/identify/types'
import { createSheetPanGesture, SHEET_ENTER_TIMING } from '@/lib/draggable-sheet'

export type CaptureResultSheetPhase = 'hidden' | 'loading' | 'success' | 'error' | 'manual' | 'saved'

interface CaptureResultSheetProps {
  phase: CaptureResultSheetPhase
  result: IdentResult | null
  errorMessage: string | null
  manualHint?: string
  bottomInset: number
  isSavingCollection?: boolean
  isPublished: boolean
  onAddToCollection: () => void
  onChooseSpecies: () => void
  onRetake: () => void
  onRetry?: () => void
  onOpenLocationPicker: () => void
  onReturnToCamera?: () => void
}

export function CaptureResultSheet({
  phase,
  result,
  errorMessage,
  manualHint,
  bottomInset,
  isSavingCollection = false,
  isPublished,
  onAddToCollection,
  onChooseSpecies,
  onRetake,
  onRetry,
  onOpenLocationPicker,
  onReturnToCamera,
}: CaptureResultSheetProps) {
  const { height: windowHeight } = useWindowDimensions()
  const [aiInfoVisible, setAiInfoVisible] = useState(false)
  const translateY = useSharedValue(windowHeight)
  const dragStartY = useSharedValue(0)

  const phaseRef = useRef(phase)
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const finishRetake = useCallback(() => {
    onRetake()
  }, [onRetake])

  const handleRetakePress = useCallback(() => {
    cancelAnimation(translateY)
    finishRetake()
  }, [finishRetake, translateY])

  const handleDismiss = useCallback(() => {
    if (phaseRef.current === 'saved') {
      onReturnToCamera?.()
    } else {
      onRetake()
    }
  }, [onRetake, onReturnToCamera])

  useEffect(() => {
    if (phase === 'hidden' || phase === 'loading') {
      cancelAnimation(translateY)
      translateY.value = windowHeight
      return
    }
    translateY.value = withTiming(0, SHEET_ENTER_TIMING)
  }, [phase, translateY, windowHeight])

  const panGesture = createSheetPanGesture({
    translateY,
    dragStartY,
    enabled: phase !== 'loading' && phase !== 'hidden',
    minY: 0,
    maxY: windowHeight,
    restY: 0,
    dismissY: windowHeight,
    onDismiss: handleDismiss,
  })

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - translateY.value / windowHeight) * 0.55,
  }))

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  if (phase === 'hidden') return null

  const confidencePercent = result ? Math.round(result.confidence * 100) : 0
  const showRetakeControl = phase !== 'loading'

  return (
    <>
      <ReAnimated.View style={[styles.overlay, overlayStyle]} pointerEvents="none" />
      <GestureDetector gesture={panGesture}>
        <ReAnimated.View
          style={[
            styles.card,
            { paddingBottom: bottomInset + space[16] },
            cardAnimatedStyle,
          ]}>
        <View style={styles.headerRow}>
          {phase === 'success' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="About AI identification"
              onPress={() => setAiInfoVisible(true)}
              style={({ pressed }) => [styles.retakeButton, pressed && styles.retakeButtonPressed]}>
              <Ionicons name="information-circle-outline" size={22} color={colors.ink2} />
            </Pressable>
          ) : (
            <View style={styles.headerSide} />
          )}
          <View style={styles.handleWrap}>
            <View style={styles.handle} />
          </View>
          {phase === 'saved' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to camera"
              onPress={() => { cancelAnimation(translateY); onReturnToCamera?.() }}
              style={({ pressed }) => [styles.retakeButton, pressed && styles.retakeButtonPressed]}>
              <Ionicons name="close" size={22} color={colors.ink2} />
            </Pressable>
          ) : phase === 'success' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isPublished ? 'Edit sighting location' : 'Pin and share sighting location'}
              onPress={onOpenLocationPicker}
              style={({ pressed }) => [styles.retakeButton, pressed && styles.retakeButtonPressed]}>
              <Ionicons
                name={isPublished ? 'location' : 'location-outline'}
                size={22}
                color={isPublished ? colors.green : colors.ink2}
              />
            </Pressable>
          ) : showRetakeControl ? (
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

        <Modal
          visible={aiInfoVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setAiInfoVisible(false)}>
          <Pressable
            style={styles.modalBackdrop}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
            onPress={() => setAiInfoVisible(false)}>
            <Pressable style={styles.modalCard} onPress={() => {}}>
              <View style={styles.modalTitleRow}>
                <Text style={styles.modalEmoji}>🤖</Text>
                <Text style={styles.modalTitle}>AI-powered identification</Text>
              </View>
              <Text style={styles.modalBody}>
                This identification was made using AI trained on millions of wildlife observations. Results are a best guess and may not always be correct.
                {'\n\n'}
                Always verify with a field guide or expert before making decisions based on this identification, especially for safety-critical species.
              </Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setAiInfoVisible(false)}
                style={({ pressed }) => [styles.modalDismiss, pressed && styles.modalDismissPressed]}>
                <Text style={styles.modalDismissLabel}>Got it</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {phase === 'saved' ? (
          <>
            <Text style={styles.savedStatusLabel}>Added to Wild Dex & My Sightings</Text>
            <PopButton label="Return to Camera" onPress={onReturnToCamera ?? onRetake} />
          </>
        ) : null}

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

            <Text style={styles.privacyHint}>
              Your sighting is private.{'\n'}Tap the GPS icon to share on the Nearby map.
            </Text>

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
    </>
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
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 19,
  },
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
  savedStatusLabel: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
    textAlign: 'center',
    marginBottom: space[24],
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
    marginBottom: space[40],
    alignSelf: 'stretch',
  },
  privacyHint: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: space[16],
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    marginBottom: space[16],
    alignSelf: 'stretch',
  },
  checkRowDisabled: {
    opacity: 0.45,
  },
  checkText: {
    flex: 1,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 20,
  },
  checkTextDisabled: {
    color: colors.dim,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(21,33,48,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[32],
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: space[24],
    gap: space[16],
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
  },
  modalEmoji: {
    fontSize: 28,
    lineHeight: 34,
  },
  modalTitle: {
    flex: 1,
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  modalBody: {
    fontSize: typeTokens.size.body,
    color: colors.ink2,
    lineHeight: 22,
  },
  modalDismiss: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    marginTop: space[8],
  },
  modalDismissPressed: {
    opacity: 0.85,
  },
  modalDismissLabel: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
})
