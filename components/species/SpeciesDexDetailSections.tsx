import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import type { SpeciesDetail, SpeciesStat, SpeciesVital } from '@/data/species-catalog'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

interface SpeciesDexDetailSectionsProps {
  species: SpeciesDetail
  showDexNumber?: boolean
  showStats?: boolean
  style?: StyleProp<ViewStyle>
}

export function SpeciesDexDetailSections({
  species,
  showDexNumber = true,
  showStats = true,
  style,
}: SpeciesDexDetailSectionsProps) {
  return (
    <View style={[styles.wrap, style]}>
      {showDexNumber ? <Text style={styles.dexNumber}>{species.dexNumber}</Text> : null}

      {showStats ? (
        <View style={styles.gameStatsGrid}>
          {species.stats.map((stat) => (
            <GameStat key={stat.label} stat={stat} />
          ))}
        </View>
      ) : null}

      {species.description ? (
        <View style={styles.aboutCard}>
          <Text style={styles.sectionTitle}>WHAT IT IS</Text>
          <Text style={styles.aboutText}>{species.description}</Text>
        </View>
      ) : null}

      {species.vitals.length > 0 ? (
        <>
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
        </>
      ) : null}

      <Text style={styles.sectionTitle}>TAXONOMY</Text>
      <View style={styles.taxonomyCard}>
        <TaxonomyRow label="KINGDOM" value={species.taxonomy.kingdom} />
        <TaxonomyRow label="PHYLUM" value={species.taxonomy.phylum} />
        <TaxonomyRow label="CLASS" value={species.taxonomy.class} isLast />
      </View>
    </View>
  )
}

export function SpeciesGameStatsGrid({ species }: { species: SpeciesDetail }) {
  return (
    <View style={styles.gameStatsGrid}>
      {species.stats.map((stat) => (
        <GameStat key={stat.label} stat={stat} />
      ))}
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

const styles = StyleSheet.create({
  wrap: {
    gap: space[16],
  },
  dexNumber: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
    letterSpacing: 0.2,
  },
  gameStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space[16],
  },
  gameStat: {
    width: '47%',
    gap: space[8],
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
  aboutCard: {
    gap: space[8],
  },
  aboutText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 22,
  },
  sectionTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.3,
    marginTop: space[4],
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
    paddingVertical: space[8],
    paddingHorizontal: space[8],
    gap: space[8],
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
    gap: space[4],
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
    paddingVertical: space[16],
    gap: space[16],
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
