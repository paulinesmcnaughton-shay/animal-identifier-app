import { useRouter } from 'expo-router'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { DexCard, type DexCardSpecies } from '@/components/DexCard'
import { getRecentFindDexCards, getRecentFinds, recentFindRouteParams } from '@/data/mock'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface RecentSpotsSectionProps {
  spotsCaptured: number
  title?: string
  cardWidth: number
  onSeeAll?: () => void
  seeAllLabel?: string
  horizontalPadding?: number
}

export function RecentSpotsSection({
  spotsCaptured,
  title = 'Recent spots',
  cardWidth,
  onSeeAll,
  seeAllLabel = 'See all',
  horizontalPadding = space[16],
}: RecentSpotsSectionProps) {
  const router = useRouter()
  const recentFinds = spotsCaptured > 0 ? getRecentFindDexCards() : []

  const handleOpenSpecies = (species: DexCardSpecies) => {
    const item = getRecentFinds().find((find) => find.id === species.id)
    router.push({
      pathname: '/species/[id]',
      params: item
        ? recentFindRouteParams(item)
        : {
            id: species.id,
            name: species.name,
            number: species.number,
            kingdom: species.kingdom,
          },
    })
  }

  const handleSeeAll = onSeeAll ?? (() => router.navigate('/dex'))

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSub}>
            {spotsCaptured === 0
              ? 'Nothing spotted yet — head outside!'
              : `${spotsCaptured} spotted · keep exploring`}
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          accessibilityRole="link"
          accessibilityLabel={`${seeAllLabel} in Wild Dex`}
          onPress={handleSeeAll}>
          <Text style={styles.seeAll}>{seeAllLabel}</Text>
        </TouchableOpacity>
      </View>
      {recentFinds.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.spotsScroll, { paddingHorizontal: horizontalPadding }]}>
          {recentFinds.map((species) => (
            <DexCard
              key={species.id}
              width={cardWidth}
              species={species}
              onPress={() => handleOpenSpecies(species)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={[styles.recentEmpty, { marginHorizontal: horizontalPadding }]}>
          <Text style={styles.recentEmptyText}>Your first find will show up here.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  section: {
    gap: space[16],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: space[16],
    paddingHorizontal: space[16],
    gap: space[12],
  },
  sectionTitle: {
    fontSize: typeTokens.size.bodyLG,
    fontWeight: '800',
    color: colors.ink,
  },
  sectionSub: {
    marginTop: space[4],
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
  },
  seeAll: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.green,
  },
  spotsScroll: {
    gap: space[8],
    paddingRight: screenLayout.padH,
  },
  recentEmpty: {
    paddingVertical: space[16],
    paddingHorizontal: screenLayout.padH,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  recentEmptyText: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    textAlign: 'center',
  },
})
