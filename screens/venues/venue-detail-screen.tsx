import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { fetchVenue, fetchVenueAnimals, type Venue, type VenueAnimal } from '@/features/collections/venues'
import { useReferenceImage } from '@/features/species/use-reference-image'

export function VenueDetailScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const params = useLocalSearchParams<{ id?: string | string[] }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? ''

  const [venue, setVenue] = useState<Venue | null>(null)
  const [animals, setAnimals] = useState<VenueAnimal[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    void Promise.all([fetchVenue(id), fetchVenueAnimals(id)]).then(([v, a]) => {
      if (cancelled) return
      setVenue(v)
      setAnimals(a)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [id])

  const zones = useMemo(() => {
    const byZone = new Map<string, VenueAnimal[]>()
    for (const a of animals) {
      const z = a.zone ?? 'Animals'
      const list = byZone.get(z) ?? []
      list.push(a)
      byZone.set(z, list)
    }
    return [...byZone.entries()]
  }, [animals])

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + space[40] }}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { paddingTop: contentTopInset(insets.top) }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.heroType}>{(venue?.type ?? '').replace('_', ' ').toUpperCase()}</Text>
          <Text style={styles.heroName}>{venue?.name ?? 'Venue'}</Text>
          {venue?.region ? <Text style={styles.heroMeta}>{venue.region}</Text> : null}
        </View>

        <View style={styles.body}>
          {venue?.description ? <Text style={styles.description}>{venue.description}</Text> : null}

          <Text style={styles.sectionTitle}>MAP</Text>
          <View style={styles.mapTile}>
            {venue?.mapImageUrl ? (
              <Image source={{ uri: venue.mapImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={28} color={colors.dim} />
                <Text style={styles.mapPlaceholderText}>Venue map coming soon</Text>
              </View>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.green} />
            </View>
          ) : (
            zones.map(([zone, list]) => (
              <View key={zone} style={styles.zoneBlock}>
                <Text style={styles.sectionTitle}>{zone.toUpperCase()}</Text>
                <View style={styles.grid}>
                  {list.map((animal) => (
                    <VenueAnimalCard
                      key={animal.id}
                      animal={animal}
                      onPress={() =>
                        router.push({
                          pathname: '/species/[id]',
                          params: {
                            id: animal.speciesId ?? animal.commonName ?? '',
                            name: animal.commonName ?? '',
                            ...(animal.scientificName ? { latin: animal.scientificName } : {}),
                            ...(animal.kingdom ? { kingdom: animal.kingdom } : {}),
                            ...(animal.dexNumber ? { number: animal.dexNumber } : {}),
                          },
                        })
                      }
                    />
                  ))}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  )
}

interface VenueAnimalCardProps {
  animal: VenueAnimal
  onPress: () => void
}

function VenueAnimalCard({ animal, onPress }: VenueAnimalCardProps) {
  const { uri, onImageError } = useReferenceImage(
    {
      commonName: animal.commonName ?? '',
      scientificName: animal.scientificName,
      kingdom: (animal.kingdom ?? null) as KingdomKey | null,
      dexNum: animal.dexNumber,
      speciesId: animal.speciesId,
      appRegistryImageUrl: animal.imageUrl,
    },
    { screen: 'venue-detail', component: 'VenueAnimalCard' },
  )
  const emoji = animal.kingdom && animal.kingdom in KINGDOM ? KINGDOM[animal.kingdom as KingdomKey].emoji : '🐾'

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${animal.commonName ?? 'animal'}`}
      onPress={onPress}
      style={({ pressed }) => [styles.animalCard, pressed && styles.cardPressed]}>
      <View style={styles.animalArt}>
        {uri ? (
          <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" onError={() => onImageError(uri)} />
        ) : (
          <Text style={styles.animalEmoji}>{emoji}</Text>
        )}
      </View>
      <Text style={styles.animalName} numberOfLines={1}>{animal.commonName}</Text>
    </Pressable>
  )
}

const GAP = space[8]

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: {
    backgroundColor: colors.green,
    paddingHorizontal: screenLayout.padH,
    paddingBottom: space[24],
    gap: space[4],
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[16],
  },
  heroType: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    letterSpacing: 0.6,
    color: 'rgba(255,255,255,0.8)',
  },
  heroName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: '#fff',
  },
  heroMeta: { fontSize: typeTokens.size.bodySM, color: 'rgba(255,255,255,0.85)' },
  body: { paddingHorizontal: screenLayout.padH, paddingTop: space[16], gap: space[8] },
  description: { fontSize: typeTokens.size.body, color: colors.ink2, lineHeight: 22, marginBottom: space[8] },
  sectionTitle: {
    fontSize: typeTokens.size.label,
    fontWeight: '800',
    color: colors.ink2,
    letterSpacing: 0.5,
    marginTop: space[16],
    marginBottom: space[8],
  },
  mapTile: {
    height: 160,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.bg2,
  },
  mapPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[8] },
  mapPlaceholderText: { fontSize: typeTokens.size.bodySM, color: colors.dim },
  loading: { paddingVertical: space[40], alignItems: 'center' },
  zoneBlock: { gap: space[4] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  animalCard: { width: '31%', gap: space[4] },
  cardPressed: { opacity: 0.9 },
  animalArt: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: radius.md,
    backgroundColor: colors.hairline,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animalEmoji: { fontSize: 32 },
  animalName: { fontSize: typeTokens.size.caption, fontWeight: '700', color: colors.ink },
})
