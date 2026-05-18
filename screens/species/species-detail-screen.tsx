import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useLocalSearchParams } from 'expo-router'
import { type ReactNode } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { ScreenHeader, ScreenHeaderIconButton } from '@/design/atoms/ScreenHeader'
import { screenLayout } from '@/design/screen-layout'
import {
  getSpeciesDetail,
  resolveRouteParam,
  type SpeciesStat,
  type SpeciesVital,
} from '@/data/species-catalog'
import { useTaxaPhoto } from '@/features/species/use-taxa-photo'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

const RARITY_BADGE_BG: Record<string, string> = {
  Common: colors.ink2,
  Uncommon: colors.earth,
  Rare: colors.sun,
  'Very Rare': colors.coralDeep,
}

export function SpeciesDetailScreen() {
  const insets = useSafeAreaInsets()
  const params = useLocalSearchParams<{
    id?: string | string[]
    name?: string | string[]
    number?: string | string[]
    kingdom?: string | string[]
    confidence?: string | string[]
    latin?: string | string[]
  }>()

  const id = resolveRouteParam(params.id) ?? 'unknown'
  const paramName = resolveRouteParam(params.name)
  const paramNumber = resolveRouteParam(params.number)
  const kingdomRaw = resolveRouteParam(params.kingdom)
  const kingdomOverride =
    kingdomRaw && kingdomRaw in KINGDOM ? (kingdomRaw as KingdomKey) : undefined

  const species = getSpeciesDetail(id, {
    commonName: paramName,
    dexNumber: paramNumber,
    kingdom: kingdomOverride,
    spottedAt: paramName ? undefined : 'Just now',
  })

  const photoUrl = useTaxaPhoto(species.latinName || species.commonName)
  const kingdomMeta = KINGDOM[species.kingdom]

  const handleBack = () => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/dex')
  }

  const handleView3d = () => {
    router.push({ pathname: '/capture/view3d', params: { name: species.commonName } })
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top, paddingBottom: insets.bottom + space[32] },
        ]}>
        <ScreenHeader
          onBack={handleBack}
          center={<Text style={styles.headerDex}>{species.dexNumber}</Text>}
          right={
            <ScreenHeaderIconButton
              accessibilityLabel="Share species"
              icon="share-social-outline"
              onPress={() => {}}
            />
          }
          style={styles.screenHeaderInset}
        />

        <View style={styles.profileCardShadow}>
          <View style={styles.profileCard}>
          <View style={styles.heroArt}>
            {photoUrl ? (
              <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={[...species.gradient]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
              />
            )}

            <View style={[styles.kingdomChip, { backgroundColor: kingdomMeta?.bg ?? colors.plum }]}>
              <Text style={styles.kingdomChipEmoji}>{kingdomMeta?.emoji ?? '🌿'}</Text>
              <Text style={styles.kingdomChipLabel}>{kingdomMeta?.label?.toUpperCase() ?? 'SPECIES'}</Text>
            </View>

            <View style={[styles.rarityChip, { backgroundColor: RARITY_BADGE_BG[species.rarity] ?? colors.earth }]}>
              <Ionicons name="star" size={12} color={colors.card} />
              <Text style={styles.rarityChipText}>{species.rarity}</Text>
            </View>

            <HeroActionButton
              accessibilityLabel="View in 3D"
              onPress={handleView3d}
              position="left">
              <Ionicons name="cube-outline" size={18} color={colors.ink} />
            </HeroActionButton>

            {species.sounds ? (
              <HeroActionButton
                accessibilityLabel="Play species sound"
                onPress={() => {}}
                position="right">
                <Ionicons name="volume-high" size={18} color={colors.ink} />
              </HeroActionButton>
            ) : null}
          </View>

          <View style={styles.profileBody}>
            <Text style={styles.commonName}>{species.commonName}</Text>
            <Text style={styles.latinName}>{species.latinName}</Text>

            <View style={styles.gameStatsGrid}>
              {species.stats.map((stat) => (
                <GameStat key={stat.label} stat={stat} />
              ))}
            </View>
          </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>VITALS</Text>
        <View style={styles.vitalsRows}>
          {chunkPairs(species.vitals).map((row, rowIndex) => (
            <View key={`vital-row-${rowIndex}`} style={styles.vitalsRow}>
              {row.map((vital) => (
                <VitalCard key={vital.label} vital={vital} />
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>TAXONOMY</Text>
        <View style={styles.taxonomyCard}>
          <TaxonomyRow label="KINGDOM" value={species.taxonomy.kingdom} />
          <TaxonomyRow label="PHYLUM" value={species.taxonomy.phylum} />
          <TaxonomyRow label="CLASS" value={species.taxonomy.class} isLast />
        </View>
      </ScrollView>
    </View>
  )
}

interface HeroActionButtonProps {
  accessibilityLabel: string
  onPress: () => void
  position: 'left' | 'right'
  children: ReactNode
}

function HeroActionButton({
  accessibilityLabel,
  onPress,
  position,
  children,
}: HeroActionButtonProps) {
  return (
    <View
      style={[
        styles.heroActionShadow,
        position === 'left' ? styles.heroActionBtnLeft : styles.heroActionBtnRight,
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [
          styles.heroActionBtn,
          pressed && styles.heroActionBtnPressed,
        ]}>
        {children}
      </Pressable>
    </View>
  )
}

function chunkPairs<T>(items: T[]): T[][] {
  const rows: T[][] = []
  for (let i = 0; i < items.length; i += 2) {
    rows.push(items.slice(i, i + 2))
  }
  return rows
}

function GameStat({ stat }: { stat: SpeciesStat }) {
  return (
    <View style={styles.gameStat}>
      <View style={styles.gameStatHeader}>
        <Text style={styles.gameStatLabel}>{stat.label}</Text>
        <Text style={[styles.gameStatValue, { color: stat.color }]}>{stat.value}</Text>
      </View>
      <View style={styles.gameStatTrack}>
        <View
          style={[
            styles.gameStatFill,
            { width: `${Math.min(100, stat.value)}%`, backgroundColor: stat.color },
          ]}
        />
      </View>
    </View>
  )
}

function VitalCard({ vital }: { vital: SpeciesVital }) {
  const iconName =
    vital.icon === 'flash'
      ? 'flash'
      : vital.icon === 'heart'
        ? 'heart'
        : vital.icon === 'leaf'
          ? 'leaf'
          : 'resize-outline'

  return (
    <View style={styles.vitalCard}>
      <View style={[styles.vitalIconWrap, { backgroundColor: vital.tint }]}>
        <Ionicons name={iconName} size={16} color={vital.iconColor} />
      </View>
      <View style={styles.vitalTextCol}>
        <Text style={styles.vitalLabel}>{vital.label}</Text>
        <Text style={styles.vitalValue} numberOfLines={2}>
          {vital.value}
        </Text>
      </View>
    </View>
  )
}

function TaxonomyRow({
  label,
  value,
  isLast,
}: {
  label: string
  value: string
  isLast?: boolean
}) {
  return (
    <View style={[styles.taxonomyRow, !isLast && styles.taxonomyRowBorder]}>
      <Text style={styles.taxonomyLabel}>{label}</Text>
      <Text style={styles.taxonomyValue}>{value}</Text>
    </View>
  )
}

const HERO_HEIGHT = 220

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollView: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerDex: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.88,
  },
  scroll: {
    flexGrow: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: screenLayout.padH,
    gap: space[16],
  },
  screenHeaderInset: {
    marginHorizontal: -screenLayout.padH,
    paddingHorizontal: screenLayout.padH,
    backgroundColor: colors.bg,
  },
  profileCardShadow: {
    borderRadius: radius.xl,
    backgroundColor: 'transparent',
    ...shadow.dexCard,
  },
  profileCard: {
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  heroArt: {
    height: HERO_HEIGHT,
    backgroundColor: colors.hairline,
  },
  profileBody: {
    position: 'relative',
    backgroundColor: colors.card,
    paddingHorizontal: space[20],
    paddingTop: space[20],
    paddingBottom: space[20],
    gap: space[4],
  },
  kingdomChip: {
    position: 'absolute',
    top: space[12],
    left: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[6],
    paddingHorizontal: space[10],
    paddingVertical: space[6],
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
    top: space[12],
    right: space[12],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingHorizontal: space[10],
    paddingVertical: space[6],
    borderRadius: radius.pill,
  },
  rarityChipText: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.card,
  },
  heroActionShadow: {
    position: 'absolute',
    bottom: space[8],
    borderRadius: radius.pill,
    backgroundColor: `${colors.ink}0E`,
    paddingBottom: space[2],
    zIndex: 2,
  },
  heroActionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  heroActionBtnPressed: {
    transform: [{ translateY: 1 }],
  },
  heroActionBtnLeft: {
    left: space[8],
  },
  heroActionBtnRight: {
    right: space[8],
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
    marginBottom: space[12],
  },
  gameStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[14],
    marginTop: space[4],
  },
  gameStat: {
    width: '47%',
    gap: space[6],
  },
  gameStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameStatLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    letterSpacing: 0.5,
  },
  gameStatValue: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  gameStatTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
  },
  gameStatFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
  sectionTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: space[8],
  },
  vitalsRows: {
    width: '100%',
    gap: space[8],
  },
  vitalsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: space[8],
  },
  vitalCard: {
    flex: 1,
    flexBasis: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: space[10],
    paddingHorizontal: space[10],
    gap: space[10],
    ...shadow.card,
  },
  vitalIconWrap: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  vitalTextCol: {
    flex: 1,
    gap: space[2],
    justifyContent: 'center',
  },
  vitalLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    letterSpacing: 0.5,
  },
  vitalValue: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    lineHeight: 16,
  },
  taxonomyCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: space[16],
    ...shadow.card,
  },
  taxonomyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: space[14],
    gap: space[12],
  },
  taxonomyRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  taxonomyLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    letterSpacing: 0.5,
  },
  taxonomyValue: {
    flex: 1,
    textAlign: 'right',
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
})
