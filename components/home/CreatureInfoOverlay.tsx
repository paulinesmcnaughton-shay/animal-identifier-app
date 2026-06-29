import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import Reanimated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import {
  SpeciesDexDetailSections,
  SpeciesGameStatsGrid,
} from '@/components/species/SpeciesDexDetailSections'
import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { screenLayout } from '@/design/screen-layout'
import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import {
  colors,
  profileCardShadow as profileCardShadowStyle,
  radius,
  space,
  type as typeTokens,
} from '@/design/tokens'
import { useReferenceImage } from '@/features/species/use-reference-image'
import { useSpeciesDetail } from '@/features/species/use-species-detail'
import {
  createSheetPanGesture,
  SHEET_ENTER_TIMING,
  SHEET_EXIT_TIMING,
} from '@/lib/draggable-sheet'

const SHEET_TOP_GAP = space[40]
const BACKDROP_FADE_MS = 520
const BACKDROP_EASE = Easing.out(Easing.quad)
const HERO_HEIGHT = 220
const BACKDROP_OPACITY = 0.75
const BACKDROP_COLOR = '#000000'
/** Soft edge at the physical bottom (safe area only) — not over scroll content. */
const SHEET_BOTTOM_FADE_HEIGHT = space[24]
const SHEET_SECTION_TO_FOOTER_GAP = space[40]
const SHEET_BG_RGB = '255, 248, 231'

const RARITY_BADGE_BG: Record<string, string> = {
  Rare: colors.sun,
  'Very Rare': colors.coralDeep,
}

const GLASS_RARITY_LABELS = new Set(['Common', 'Uncommon'])

function rarityChipVariantStyle(rarity: string) {
  if (GLASS_RARITY_LABELS.has(rarity)) {
    return {
      backgroundColor: 'rgba(255, 255, 255, 0.5)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.hairline,
    }
  }
  return { backgroundColor: RARITY_BADGE_BG[rarity] ?? colors.earth }
}

function isGlassRarityChip(rarity: string): boolean {
  return GLASS_RARITY_LABELS.has(rarity)
}

export interface CreatureInfoData {
  id: string
  commonName: string
  scientificName: string
  kingdom: string
  description: string
  bonusXp: number
  dexNumber?: string
}

interface CreatureInfoOverlayProps {
  visible: boolean
  creature: CreatureInfoData
  onClose: () => void
}

function kingdomLabelToKey(label: string): KingdomKey {
  const lower = label.trim().toLowerCase()
  if (lower === 'reptile') return 'reptile'
  if (lower === 'bird') return 'bird'
  if (lower === 'insect') return 'insect'
  if (lower === 'amphibian') return 'amphibian'
  if (lower === 'fish') return 'fish'
  if (lower === 'arachnid') return 'arachnid'
  if (lower === 'mollusc') return 'mollusc'
  if (lower === 'plant') return 'plant'
  return 'mammal'
}

export function CreatureInfoOverlay({ visible, creature, onClose }: CreatureInfoOverlayProps) {
  const insets = useSafeAreaInsets()
  const sheetTop = insets.top + SHEET_TOP_GAP
  const windowHeight = Dimensions.get('window').height
  /** Extend through the home indicator so the modal backdrop does not show as a black strip. */
  const sheetBottomBleed = insets.bottom
  const offscreenY = windowHeight - sheetTop + sheetBottomBleed
  const translateY = useSharedValue(offscreenY)
  const dragStartY = useSharedValue(0)
  const backdropOpacity = useSharedValue(0)
  const isAnimatingOut = useRef(false)
  const [isRendered, setIsRendered] = useState(false)

  const kingdomKey = useMemo(() => kingdomLabelToKey(creature.kingdom), [creature.kingdom])
  const kingdomMeta = KINGDOM[kingdomKey]
  const { uri: heroUri, onImageError } = useReferenceImage({
    speciesId: creature.id,
    commonName: creature.commonName,
    scientificName: creature.scientificName,
    kingdom: kingdomKey,
    dexNum: creature.dexNumber,
  })

  const { species } = useSpeciesDetail({
    id: creature.id,
    enabled: visible || isRendered,
    silent: true,
    overrides: {
      commonName: creature.commonName,
      latinName: creature.scientificName,
      kingdom: kingdomKey,
      description: creature.description,
      ...(creature.dexNumber ? { dexNumber: creature.dexNumber } : {}),
    },
  })

  const finishClose = useCallback(() => {
    isAnimatingOut.current = false
    setIsRendered(false)
    onClose()
  }, [onClose])

  const fadeBackdropOut = useCallback(() => {
    backdropOpacity.value = withTiming(0, { duration: BACKDROP_FADE_MS, easing: BACKDROP_EASE })
  }, [backdropOpacity])

  const animateOpen = useCallback(() => {
    cancelAnimation(translateY)
    isAnimatingOut.current = false
    translateY.value = offscreenY
    backdropOpacity.value = 0
    backdropOpacity.value = withTiming(1, { duration: BACKDROP_FADE_MS, easing: BACKDROP_EASE })
    translateY.value = withTiming(0, SHEET_ENTER_TIMING)
  }, [backdropOpacity, offscreenY, translateY])

  const animateClose = useCallback(() => {
    if (isAnimatingOut.current) return
    isAnimatingOut.current = true
    cancelAnimation(translateY)
    fadeBackdropOut()
    translateY.value = withTiming(offscreenY, SHEET_EXIT_TIMING, (finished) => {
      if (finished) runOnJS(finishClose)()
    })
  }, [fadeBackdropOut, finishClose, offscreenY, translateY])

  const beginDragDismiss = useCallback(() => {
    if (isAnimatingOut.current) return
    isAnimatingOut.current = true
    fadeBackdropOut()
  }, [fadeBackdropOut])

  const completeDragDismiss = useCallback(() => {
    finishClose()
  }, [finishClose])

  useEffect(() => {
    if (visible) {
      setIsRendered(true)
      return
    }
    if (isRendered && !isAnimatingOut.current) {
      animateClose()
    }
  }, [visible, isRendered, animateClose])

  useEffect(() => {
    if (visible && isRendered) {
      animateOpen()
    }
  }, [visible, isRendered, animateOpen])

  const dismissSheet = useCallback(() => {
    animateClose()
  }, [animateClose])

  const panGesture = useMemo(
    () =>
      createSheetPanGesture({
        translateY,
        dragStartY,
        enabled: isRendered && !isAnimatingOut.current,
        minY: -SHEET_TOP_GAP,
        maxY: offscreenY,
        restY: 0,
        expandedY: -SHEET_TOP_GAP,
        dismissY: offscreenY,
        motion: 'info',
        onDismissStart: beginDragDismiss,
        onDismiss: completeDragDismiss,
      }),
    [isRendered, translateY, dragStartY, offscreenY, beginDragDismiss, completeDragDismiss],
  )

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value * BACKDROP_OPACITY,
  }))

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const tipText =
    'Tip: Scan at dusk when they are most active on leaves and branches in warm, humid areas.'

  if (!isRendered) return null

  return (
    <Modal visible transparent animationType="none" onRequestClose={dismissSheet}>
      <GestureHandlerRootView style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close creature info"
          style={StyleSheet.absoluteFill}
          onPress={dismissSheet}>
          <Reanimated.View style={[styles.backdrop, backdropStyle]} />
        </Pressable>

        <Reanimated.View
          style={[
            styles.sheet,
            { top: sheetTop, marginBottom: -sheetBottomBleed, paddingBottom: sheetBottomBleed },
            sheetStyle,
          ]}>
          <View style={styles.sheetBody}>
            <GestureDetector gesture={panGesture}>
              <View
                style={styles.handleHitArea}
                accessibilityRole="adjustable"
                accessibilityLabel="Drag sheet">
                <View style={styles.handle} />
              </View>
            </GestureDetector>

            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              contentInsetAdjustmentBehavior="never"
              bounces
              nestedScrollEnabled>
            <Text style={styles.headerDex}>{species.dexNumber}</Text>

            <View style={styles.profileCardShadow}>
              <View style={styles.profileCard}>
                <View style={styles.heroArt}>
                  {heroUri ? (
                    <Image
                      source={{ uri: heroUri }}
                      onError={() => onImageError(heroUri)}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      contentPosition="center"
                    />
                  ) : (
                    <View style={styles.heroPlaceholder}>
                      <Text style={styles.heroPlaceholderEmoji}>{kingdomMeta.emoji}</Text>
                    </View>
                  )}

                  <View style={[styles.kingdomChip, { backgroundColor: kingdomMeta.bg }]}>
                    <Text style={styles.kingdomChipEmoji}>{kingdomMeta.emoji}</Text>
                    <Text style={styles.kingdomChipLabel}>
                      {kingdomMeta.label.toUpperCase()}
                    </Text>
                  </View>

                  <View style={[styles.rarityChip, rarityChipVariantStyle(species.rarity)]}>
                    <Ionicons
                      name="star"
                      size={12}
                      color={isGlassRarityChip(species.rarity) ? colors.ink : colors.card}
                    />
                    <Text
                      style={[
                        styles.rarityChipText,
                        isGlassRarityChip(species.rarity) && styles.rarityChipTextGlass,
                      ]}>
                      {species.rarity}
                    </Text>
                  </View>
                </View>

                <View style={styles.profileBody}>
                  <Text style={styles.commonName}>{species.commonName}</Text>
                  <Text style={styles.latinName}>{species.latinName}</Text>

                  <View style={styles.gameStatsWrap}>
                    <SpeciesGameStatsGrid species={species} />
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fieldGuide}>
              <Text style={styles.fieldGuideBody}>{creature.description}</Text>
              <Text style={styles.fieldGuideTip}>{tipText}</Text>
            </View>

            <SpeciesDexDetailSections
              species={species}
              showDexNumber={false}
              showStats={false}
              style={styles.detailSections}
            />
            </ScrollView>

            <LinearGradient
              pointerEvents="none"
              colors={[`rgba(${SHEET_BG_RGB}, 0)`, `rgba(${SHEET_BG_RGB}, 1)`]}
              locations={[0, 1]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[
                styles.sheetBottomFade,
                { height: SHEET_BOTTOM_FADE_HEIGHT + insets.bottom },
              ]}
            />
          </View>
        </Reanimated.View>
      </GestureHandlerRootView>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: `rgba(0, 0, 0, ${BACKDROP_OPACITY})`,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP_COLOR,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...slideUpSheetShell(colors.bg),
  },
  sheetBody: {
    flex: 1,
    backgroundColor: colors.bg,
    position: 'relative',
  },
  sheetBottomFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  handleHitArea: {
    alignItems: 'center',
    paddingVertical: space[16],
    backgroundColor: colors.bg,
  },
  handle: slideUpSheetHandle,
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 0,
    backgroundColor: colors.bg,
    paddingHorizontal: screenLayout.padH,
    gap: space[16],
  },
  detailSections: {
    marginBottom: SHEET_SECTION_TO_FOOTER_GAP,
  },
  headerDex: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  profileCardShadow: {
    borderRadius: radius.xl,
    ...profileCardShadowStyle,
    backgroundColor: colors.bg,
  },
  profileCard: {
    borderRadius: radius.xl,
    backgroundColor: colors.card,
    overflow: 'visible',
  },
  heroArt: {
    height: HERO_HEIGHT,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  heroPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(30,92,58,0.12)',
  },
  heroPlaceholderEmoji: {
    fontSize: 72,
    opacity: 0.5,
  },
  kingdomChip: {
    position: 'absolute',
    top: space[16],
    left: space[16],
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  kingdomChipEmoji: {
    fontSize: 14,
  },
  kingdomChipLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.card,
    letterSpacing: 0.5,
  },
  rarityChip: {
    position: 'absolute',
    top: space[16],
    right: space[16],
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    borderRadius: radius.pill,
  },
  rarityChipText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  rarityChipTextGlass: {
    color: colors.ink,
  },
  profileBody: {
    position: 'relative',
    backgroundColor: colors.card,
    paddingHorizontal: space[16],
    paddingTop: space[16],
    paddingBottom: space[16],
    gap: space[4],
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  commonName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  latinName: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    fontStyle: 'italic',
    color: colors.ink2,
    marginBottom: space[16],
  },
  gameStatsWrap: {
    marginTop: space[4],
  },
  fieldGuide: {
    gap: space[8],
  },
  fieldGuideBody: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 22,
  },
  fieldGuideTip: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 20,
  },
})
