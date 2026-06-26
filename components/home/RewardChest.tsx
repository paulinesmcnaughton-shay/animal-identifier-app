import { LinearGradient } from 'expo-linear-gradient'
import { useEffect } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const BG_GRADIENT = ['#1E5C3A', '#16321F', '#0c2417'] as const
const CARD_GRADIENT = ['#23231a', '#0b0b07'] as const

export interface RareCard {
  name: string
  detail: string
  emoji: string
  bonusXp: number
  collected: number
  total: number
  collectionLabel: string
}

const SAMPLE_CARD: RareCard = {
  name: 'Tyrannosaurus rex',
  detail: 'Tyrannosaurus rex · Cretaceous',
  emoji: '🦖',
  bonusXp: 250,
  collected: 3,
  total: 12,
  collectionLabel: 'PREHISTORIC',
}

interface RewardChestProps {
  visible: boolean
  day: number
  card?: RareCard
  onAddToDex: () => void
  onDismiss: () => void
}

export function RewardChest({ visible, day, card = SAMPLE_CARD, onAddToDex, onDismiss }: RewardChestProps) {
  const rise = useSharedValue(0)
  useEffect(() => {
    if (visible) {
      rise.value = 0
      rise.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.back(1.4)) })
    }
  }, [visible, rise])
  const cardStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{ translateY: (1 - rise.value) * 40 }, { scale: 0.9 + rise.value * 0.1 }],
  }))

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onDismiss}>
      <LinearGradient colors={BG_GRADIENT} style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.kicker}>DAILY CHEST · DAY {day}</Text>
          <Text style={styles.headline}>You found something rare!</Text>
        </View>

        <Animated.View style={[styles.cardShadow, cardStyle]}>
          <LinearGradient colors={CARD_GRADIENT} style={styles.card}>
            <View style={styles.ribbon}>
              <Text style={styles.ribbonText}>✦ {card.collectionLabel}</Text>
            </View>

            <View style={styles.art}>
              <Text style={styles.artEmoji}>{card.emoji}</Text>
              <View style={styles.newTag}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            </View>

            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardDetail}>{card.detail}</Text>
            <View style={styles.bonusChip}>
              <Text style={styles.bonusText}>Card bonus +{card.bonusXp} XP</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.ctaShadow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add to Dex"
            onPress={onAddToDex}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaText}>
              ADD TO DEX → {card.collected}/{card.total} {card.collectionLabel}
            </Text>
          </Pressable>
        </View>
        <Pressable accessibilityRole="button" onPress={onDismiss} style={styles.dismiss}>
          <Text style={styles.dismissText}>Come back tomorrow for another chest</Text>
        </Pressable>
      </LinearGradient>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[24],
    gap: space[32],
  },
  header: {
    alignItems: 'center',
    gap: space[8],
  },
  kicker: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1,
    color: colors.gold,
  },
  headline: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.card,
    textAlign: 'center',
  },
  cardShadow: {
    width: 260,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.gold,
    padding: space[16],
    alignItems: 'center',
    gap: space[8],
  },
  ribbon: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[4],
  },
  ribbonText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    letterSpacing: 1,
    color: colors.goldInk,
  },
  art: {
    width: '100%',
    height: 178,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artEmoji: {
    fontSize: 88,
  },
  newTag: {
    position: 'absolute',
    top: space[8],
    right: space[8],
    backgroundColor: colors.flame,
    borderRadius: radius.sm,
    paddingHorizontal: space[8],
    paddingVertical: space[4],
  },
  newText: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.card,
  },
  cardName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.gold,
  },
  cardDetail: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: 'rgba(255,255,255,0.7)',
  },
  bonusChip: {
    backgroundColor: 'rgba(250,210,78,0.16)',
    borderRadius: radius.pill,
    paddingHorizontal: space[16],
    paddingVertical: space[8],
  },
  bonusText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.gold,
  },
  ctaShadow: {
    backgroundColor: colors.goldBevel,
    borderRadius: radius.sm,
    paddingBottom: 4,
  },
  cta: {
    backgroundColor: colors.gold,
    borderRadius: radius.sm,
    paddingHorizontal: space[24],
    paddingVertical: space[16],
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
  },
  ctaText: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.goldInk,
  },
  dismiss: {
    paddingVertical: space[8],
  },
  dismissText: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: 'rgba(255,255,255,0.6)',
  },
})
