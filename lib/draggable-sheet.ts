import { Gesture } from 'react-native-gesture-handler'
import {
  cancelAnimation,
  Easing,
  runOnJS,
  withSpring,
  withTiming,
  type SharedValue,
  type WithSpringConfig,
  type WithTimingConfig,
} from 'react-native-reanimated'

export const SHEET_SPRING = { damping: 22, stiffness: 180 } as const

/** Standard enter — easing curve, zero bounce, card locks flush to bottom edge. */
export const SHEET_ENTER_TIMING: WithTimingConfig = {
  duration: 380,
  easing: Easing.out(Easing.cubic),
}

/** Standard exit — ease-in slide back below the screen. */
export const SHEET_EXIT_TIMING: WithTimingConfig = {
  duration: 200,
  easing: Easing.in(Easing.ease),
}

/** @deprecated use SHEET_ENTER_TIMING */
export const SHEET_EXIT_MS = 200
export const SHEET_SPRING_SOFT = {
  damping: 24,
  stiffness: 62,
  mass: 1.1,
  overshootClamping: false,
  restDisplacementThreshold: 0.5,
  restSpeedThreshold: 0.5,
} as const satisfies WithSpringConfig
export const SHEET_SPRING_DISMISS: WithSpringConfig = {
  ...SHEET_SPRING_SOFT,
  overshootClamping: true,
}

export const DISMISS_DRAG_PX = 56
export const DISMISS_VELOCITY = 650
export const DISMISS_TIMING_MS = 160
export const PAN_ACTIVE_OFFSET_Y = 8
export const PAN_FAIL_OFFSET_X = [-20, 20] as const

export type SheetMotion = 'capture' | 'info'

export interface SheetPanGestureConfig {
  translateY: SharedValue<number>
  dragStartY: SharedValue<number>
  enabled: boolean
  minY: number
  maxY: number
  restY: number
  expandedY?: number
  dismissY: number
  onDismiss: () => void
  onDismissStart?: () => void
  motion?: SheetMotion
}

export function createSheetPanGesture(config: SheetPanGestureConfig) {
  if (config.motion === 'info') {
    return createInfoPanGesture(config)
  }
  return createCapturePanGesture(config)
}

function createCapturePanGesture({
  translateY,
  dragStartY,
  enabled,
  minY,
  maxY,
  restY,
  expandedY,
  dismissY,
  onDismiss,
  onDismissStart,
}: SheetPanGestureConfig) {
  return Gesture.Pan()
    .enabled(enabled)
    .activeOffsetY([-PAN_ACTIVE_OFFSET_Y, PAN_ACTIVE_OFFSET_Y])
    .failOffsetX(PAN_FAIL_OFFSET_X)
    .onStart(() => {
      cancelAnimation(translateY)
      dragStartY.value = translateY.value
    })
    .onUpdate((event) => {
      const next = dragStartY.value + event.translationY
      translateY.value = Math.max(minY, Math.min(maxY, next))
    })
    .onEnd((event) => {
      const shouldDismiss =
        translateY.value > restY + DISMISS_DRAG_PX || event.velocityY > DISMISS_VELOCITY

      if (shouldDismiss) {
        if (onDismissStart) runOnJS(onDismissStart)()
        translateY.value = withTiming(dismissY, { duration: DISMISS_TIMING_MS })
        runOnJS(onDismiss)()
        return
      }

      if (expandedY != null) {
        const mid = (restY + expandedY) / 2
        if (event.velocityY < -500 || translateY.value < mid) {
          translateY.value = withSpring(expandedY, { damping: 22, stiffness: 180 })
          return
        }
      }

      translateY.value = withSpring(restY, { damping: 22, stiffness: 180 })
    })
}

function createInfoPanGesture({
  translateY,
  dragStartY,
  enabled,
  minY,
  maxY,
  restY,
  expandedY,
  dismissY,
  onDismiss,
  onDismissStart,
}: SheetPanGestureConfig) {
  return Gesture.Pan()
    .enabled(enabled)
    .activeOffsetY([-PAN_ACTIVE_OFFSET_Y, PAN_ACTIVE_OFFSET_Y])
    .failOffsetX(PAN_FAIL_OFFSET_X)
    .onStart(() => {
      cancelAnimation(translateY)
      dragStartY.value = translateY.value
    })
    .onUpdate((event) => {
      const next = dragStartY.value + event.translationY
      translateY.value = Math.max(minY, Math.min(maxY, next))
    })
    .onEnd((event) => {
      const shouldDismiss =
        translateY.value > restY + DISMISS_DRAG_PX || event.velocityY > DISMISS_VELOCITY

      if (shouldDismiss) {
        if (onDismissStart) runOnJS(onDismissStart)()
        translateY.value = withSpring(
          dismissY,
          { damping: 24, stiffness: 62, mass: 1.1, overshootClamping: true },
          (finished) => {
            if (finished) runOnJS(onDismiss)()
          },
        )
        return
      }

      if (expandedY != null) {
        const mid = (restY + expandedY) / 2
        if (event.velocityY < -500 || translateY.value < mid) {
          translateY.value = withSpring(expandedY, {
            damping: 24,
            stiffness: 62,
            mass: 1.1,
            overshootClamping: false,
          })
          return
        }
      }

      translateY.value = withSpring(restY, {
        damping: 24,
        stiffness: 62,
        mass: 1.1,
        overshootClamping: false,
      })
    })
}
