import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { joinWildpanionWaitlist } from '@/features/wildpanion/waitlist'

const outdoorBg = require('@/assets/images/wildpanion-outdoor.jpg')
const buddyHero = require('@/assets/images/wildpanion-buddy-hero.png')

const TOP_SCRIM = ['rgba(251,241,218,0.92)', 'rgba(251,241,218,0.35)', 'transparent'] as const
const BOTTOM_SCRIM = ['transparent', 'rgba(15,33,21,0.55)', 'rgba(15,33,21,0.82)'] as const

const PERKS = [
  { emoji: '🎁', label: 'Daily\nrewards' },
  { emoji: '🎀', label: 'Collect &\ndress up' },
  { emoji: '🐾', label: 'Collect new\nbuddies' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function WildpanionComingSoonScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle')
  const [error, setError] = useState<string | null>(null)

  const breathe = useSharedValue(1)
  useEffect(() => {
    breathe.value = withRepeat(
      withTiming(1.04, { duration: 2800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [breathe])
  const buddyStyle = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }))

  const handleSubmit = async () => {
    const trimmed = email.trim()
    if (!EMAIL_RE.test(trimmed)) {
      setError('Enter a valid email')
      return
    }
    setError(null)
    setStatus('saving')
    const result = await joinWildpanionWaitlist(trimmed)
    if (!result.ok) {
      setStatus('idle')
      setError(result.message)
      return
    }
    setStatus('done')
  }

  return (
    <View style={styles.root}>
      <Image source={outdoorBg} style={StyleSheet.absoluteFill} contentFit="cover" />
      <LinearGradient colors={TOP_SCRIM} style={styles.topScrim} pointerEvents="none" />
      <LinearGradient colors={BOTTOM_SCRIM} style={styles.bottomScrim} pointerEvents="none" />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={() => router.back()}
        style={[styles.back, { top: insets.top + space[8] }]}>
        <Ionicons name="chevron-back" size={22} color={colors.inkGreen} />
      </Pressable>

      <View style={[styles.hero, { paddingTop: insets.top + space[48] }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🐾 COMING SOON</Text>
        </View>
        <Text style={styles.wordmark}>Wildpanion</Text>
        <Text style={styles.tagline}>
          A soft little buddy for every adventure.{'\n'}Feed it, play, and watch it grow.
        </Text>
      </View>

      <View style={styles.buddyWrap} pointerEvents="none">
        <View style={styles.buddyShadow} />
        <Animated.View style={buddyStyle}>
          <Image source={buddyHero} style={styles.buddy} contentFit="contain" />
        </Animated.View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + space[24] }]}>
        <Text style={styles.perksLabel}>{"WHAT'S COMING"}</Text>
        <View style={styles.perks}>
          {PERKS.map((p) => (
            <View key={p.emoji} style={styles.perk}>
              <Text style={styles.perkEmoji}>{p.emoji}</Text>
              <Text style={styles.perkText}>{p.label}</Text>
            </View>
          ))}
        </View>

        {status === 'done' ? (
          <View style={styles.doneCard}>
            <Text style={styles.doneEmoji}>🎉</Text>
            <Text style={styles.doneText}>{"You're on the list — we'll let you know!"}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.waitTitle}>Be first to meet your buddy</Text>
            <View style={styles.field}>
              <TextInput
                value={email}
                onChangeText={(t) => {
                  setEmail(t)
                  if (error) setError(null)
                }}
                placeholder="you@email.com"
                placeholderTextColor={colors.dim}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={status !== 'saving'}
                style={styles.input}
                accessibilityLabel="Email address"
                onSubmitEditing={handleSubmit}
                returnKeyType="go"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Notify me when Wildpanion launches"
                onPress={handleSubmit}
                disabled={status === 'saving'}
                style={({ pressed }) => [styles.notify, pressed && styles.notifyPressed]}>
                {status === 'saving' ? (
                  <ActivityIndicator size="small" color={colors.card} />
                ) : (
                  <Text style={styles.notifyText}>Notify me</Text>
                )}
              </Pressable>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </>
        )}
        <Text style={styles.launch}>Launching Fall 2026 · iOS &amp; Android</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0F1F15',
  },
  topScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 320,
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 460,
  },
  back: {
    position: 'absolute',
    left: space[16],
    zIndex: 5,
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: space[32],
  },
  badge: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: 9,
    shadowColor: colors.goldBevel,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  badgeText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.6,
    color: colors.inkGreen,
  },
  wordmark: {
    marginTop: space[16],
    fontSize: 46,
    fontWeight: typeTokens.body.weights.black,
    color: colors.inkGreen,
    textShadowColor: 'rgba(255,255,255,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 1,
  },
  tagline: {
    marginTop: space[16],
    textAlign: 'center',
    fontSize: typeTokens.size.bodySM,
    lineHeight: 21,
    fontWeight: typeTokens.body.weights.bold,
    color: '#22451F',
  },
  buddyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -space[8],
  },
  buddyShadow: {
    position: 'absolute',
    bottom: '24%',
    width: 170,
    height: 20,
    borderRadius: 999,
    backgroundColor: 'rgba(20,50,30,0.26)',
  },
  buddy: {
    width: 230,
    height: 230,
  },
  bottom: {
    paddingHorizontal: space[24],
  },
  perksLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1.6,
    textAlign: 'center',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: space[16],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  perks: {
    flexDirection: 'row',
    gap: space[8],
    marginBottom: space[24],
  },
  perk: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    borderRadius: radius.lg,
    paddingVertical: space[16],
    paddingHorizontal: space[4],
  },
  perkEmoji: {
    fontSize: 22,
  },
  perkText: {
    marginTop: space[8],
    textAlign: 'center',
    fontSize: typeTokens.size.micro,
    lineHeight: 14,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  waitTitle: {
    textAlign: 'center',
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
    marginBottom: space[16],
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    backgroundColor: 'rgba(255,255,255,0.96)',
    paddingLeft: space[16],
    paddingRight: space[8],
    paddingVertical: space[8],
    borderRadius: radius.lg,
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.inkGreen,
  },
  notify: {
    backgroundColor: colors.inkGreen,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 96,
  },
  notifyPressed: {
    transform: [{ translateY: 2 }],
  },
  notifyText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  error: {
    marginTop: space[8],
    textAlign: 'center',
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: '#FFD7CF',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  doneCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: radius.lg,
    paddingVertical: space[16],
    paddingHorizontal: space[16],
  },
  doneEmoji: {
    fontSize: 18,
  },
  doneText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.inkGreen,
  },
  launch: {
    marginTop: space[16],
    textAlign: 'center',
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: 'rgba(255,255,255,0.92)',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
})
