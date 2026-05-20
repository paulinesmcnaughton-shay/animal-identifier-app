import { useEffect, useRef } from 'react'
import { Animated, Easing, StyleSheet, View } from 'react-native'

import { colors } from '@/design/tokens'

export type ScanFramePhase = 'idle' | 'processing' | 'locked'

const BRACKET_ARM = 24
const BRACKET_STROKE = 2
const BRACKET_INSET_MAX = 14
const PROCESSING_ACCENT = colors.sun

interface ScanFrameOverlayProps {
  phase: ScanFramePhase
  frameSize: number
  topViewportInset?: number
  bottomViewportInset?: number
  accentColor?: string
}

export function ScanFrameOverlay({
  phase,
  frameSize,
  topViewportInset = 0,
  bottomViewportInset = 0,
  accentColor = PROCESSING_ACCENT,
}: ScanFrameOverlayProps) {
  const breathe = useRef(new Animated.Value(1)).current
  const ringScale = useRef(new Animated.Value(0.35)).current
  const ringOpacity = useRef(new Animated.Value(0.55)).current
  const bracketInset = useRef(new Animated.Value(0)).current
  const bracketOpacity = useRef(new Animated.Value(1)).current
  const lockBurst = useRef(new Animated.Value(1)).current
  const idleBreatheRef = useRef<Animated.CompositeAnimation | null>(null)
  const idleRingRef = useRef<Animated.CompositeAnimation | null>(null)
  const processingAnimRef = useRef<Animated.CompositeAnimation | null>(null)
  const lockedAnimRef = useRef<Animated.CompositeAnimation | null>(null)

  const pulseRingSize = frameSize * 0.55

  useEffect(() => {
    if (phase !== 'idle') {
      idleBreatheRef.current?.stop()
      return
    }

    breathe.setValue(1)
    bracketInset.setValue(0)
    bracketOpacity.setValue(1)
    lockBurst.setValue(1)

    idleBreatheRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(breathe, {
          toValue: 0.95,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    )

    idleBreatheRef.current.start()

    return () => {
      idleBreatheRef.current?.stop()
    }
  }, [phase, breathe, bracketInset, bracketOpacity, lockBurst])

  useEffect(() => {
    if (phase !== 'idle' && phase !== 'processing') {
      idleRingRef.current?.stop()
      return
    }

    ringScale.setValue(0.35)
    ringOpacity.setValue(0.55)

    idleRingRef.current = Animated.loop(
      Animated.parallel([
        Animated.timing(ringScale, {
          toValue: 1.15,
          duration: 3000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ringOpacity, {
          toValue: 0,
          duration: 3000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      { resetBeforeIteration: true },
    )

    idleRingRef.current.start()

    return () => {
      idleRingRef.current?.stop()
    }
  }, [phase, ringScale, ringOpacity])

  useEffect(() => {
    if (phase !== 'processing') {
      processingAnimRef.current?.stop()
      if (phase === 'idle') {
        bracketInset.setValue(0)
      }
      return
    }

    idleBreatheRef.current?.stop()
    breathe.setValue(1)
    bracketInset.setValue(0)

    processingAnimRef.current = Animated.timing(bracketInset, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    })
    processingAnimRef.current.start()

    return () => {
      processingAnimRef.current?.stop()
    }
  }, [phase, bracketInset])

  useEffect(() => {
    if (phase !== 'locked') {
      lockedAnimRef.current?.stop()
      return
    }

    processingAnimRef.current?.stop()

    lockedAnimRef.current = Animated.sequence([
      Animated.sequence([
        Animated.timing(bracketOpacity, {
          toValue: 0.25,
          duration: 70,
          useNativeDriver: true,
        }),
        Animated.timing(bracketOpacity, {
          toValue: 1,
          duration: 130,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(lockBurst, {
          toValue: 1.08,
          duration: 140,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(lockBurst, {
          toValue: 1,
          friction: 7,
          tension: 180,
          useNativeDriver: true,
        }),
      ]),
    ])
    lockedAnimRef.current.start()

    return () => lockedAnimRef.current?.stop()
  }, [phase, bracketOpacity, lockBurst])

  const bracketColor =
    phase === 'locked'
      ? accentColor
      : phase === 'processing'
        ? PROCESSING_ACCENT
        : colors.card

  const showPulseRing = phase === 'idle' || phase === 'processing'
  const pulseRingColor =
    phase === 'processing' ? PROCESSING_ACCENT : 'rgba(255,255,255,0.45)'

  return (
    <View
      style={[
        styles.host,
        {
          paddingTop: topViewportInset,
          paddingBottom: bottomViewportInset,
        },
      ]}
      pointerEvents="none">
      <Animated.View
        style={[
          styles.frame,
          {
            width: frameSize,
            height: frameSize,
            transform: [{ scale: Animated.multiply(breathe, lockBurst) }],
          },
        ]}>
        {showPulseRing ? (
          <Animated.View
            style={[
              styles.pulseRing,
              {
                width: pulseRingSize,
                height: pulseRingSize,
                borderRadius: pulseRingSize / 2,
                marginTop: -pulseRingSize / 2,
                marginLeft: -pulseRingSize / 2,
                borderColor: pulseRingColor,
                opacity: ringOpacity,
                transform: [{ scale: ringScale }],
              },
            ]}
          />
        ) : null}

        <Animated.View style={[styles.brackets, { opacity: bracketOpacity }]}>
          <CornerBracket color={bracketColor} inset={bracketInset} position="topLeft" />
          <CornerBracket color={bracketColor} inset={bracketInset} position="topRight" />
          <CornerBracket color={bracketColor} inset={bracketInset} position="bottomLeft" />
          <CornerBracket color={bracketColor} inset={bracketInset} position="bottomRight" />
        </Animated.View>
      </Animated.View>
    </View>
  )
}

type CornerPosition = 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight'

interface CornerBracketProps {
  color: Animated.AnimatedInterpolation<string> | string
  inset: Animated.Value
  position: CornerPosition
}

function CornerBracket({ color, inset, position }: CornerBracketProps) {
  const isTop = position === 'topLeft' || position === 'topRight'
  const isLeft = position === 'topLeft' || position === 'bottomLeft'

  const translateX = inset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isLeft ? BRACKET_INSET_MAX : -BRACKET_INSET_MAX],
  })

  const translateY = inset.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isTop ? BRACKET_INSET_MAX : -BRACKET_INSET_MAX],
  })

  return (
    <Animated.View
      style={[
        styles.corner,
        isTop ? styles.cornerTop : styles.cornerBottom,
        isLeft ? styles.cornerLeft : styles.cornerRight,
        {
          transform: [{ translateX }, { translateY }],
          borderColor: color,
          borderTopWidth: isTop ? BRACKET_STROKE : 0,
          borderBottomWidth: !isTop ? BRACKET_STROKE : 0,
          borderLeftWidth: isLeft ? BRACKET_STROKE : 0,
          borderRightWidth: !isLeft ? BRACKET_STROKE : 0,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  frame: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  brackets: {
    ...StyleSheet.absoluteFillObject,
  },
  corner: {
    position: 'absolute',
    width: BRACKET_ARM,
    height: BRACKET_ARM,
    backgroundColor: 'transparent',
  },
  cornerTop: {
    top: 0,
  },
  cornerBottom: {
    bottom: 0,
  },
  cornerLeft: {
    left: 0,
  },
  cornerRight: {
    right: 0,
  },
})
