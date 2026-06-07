import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { COLLECTIONS } from '@/features/collections/collections'
import { fetchVenues, type Venue, type VenueType } from '@/features/collections/venues'
import { contentTopInset, screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

const TYPE_EMOJI: Record<VenueType, string> = {
  zoo: '🦒',
  aquarium: '🐠',
  museum: '🏛️',
  farm: '🐄',
  safari: '🦁',
  petting_zoo: '🐐',
}

export function VenuesScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const [venues, setVenues] = useState<Venue[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    void fetchVenues().then((rows) => {
      if (cancelled) return
      setVenues(rows)
      setIsLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: contentTopInset(insets.top), paddingBottom: insets.bottom + space[40] },
        ]}
        showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={10}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/home'))}
          style={({ pressed }) => [styles.backBtn, pressed && styles.cardPressed]}>
          <Ionicons name="chevron-back" size={22} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>Venues</Text>
        <Text style={styles.subtitle}>Partner zoos, aquariums and safari parks</Text>

        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.green} />
          </View>
        ) : venues.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No venues yet — partner venues will appear here.</Text>
          </View>
        ) : (
          venues.map((venue) => {
            const accent =
              COLLECTIONS.find((c) => c.id === venue.type)?.accent ?? colors.green
            return (
              <Pressable
                key={venue.id}
                accessibilityRole="button"
                accessibilityLabel={`Open ${venue.name}`}
                onPress={() => router.push({ pathname: '/venues/[id]', params: { id: venue.id } })}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
                <View style={[styles.cardIcon, { backgroundColor: accent }]}>
                  <Text style={styles.cardEmoji}>{TYPE_EMOJI[venue.type]}</Text>
                </View>
                <View style={styles.cardBody}>
                  <Text style={styles.cardName} numberOfLines={1}>{venue.name}</Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {venue.type.replace('_', ' ')}
                    {venue.region ? ` · ${venue.region}` : ''}
                    {venue.isPartner ? ' · Partner' : ''}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.dim} />
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: screenLayout.padH, gap: space[8] },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space[8],
  },
  title: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayLG,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  subtitle: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    marginBottom: space[16],
  },
  empty: { paddingVertical: space[40], alignItems: 'center' },
  emptyText: { fontSize: typeTokens.size.body, color: colors.dim, textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[16],
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: space[16],
  },
  cardPressed: { opacity: 0.9 },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji: { fontSize: 24 },
  cardBody: { flex: 1, gap: space[4] },
  cardName: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.ink,
  },
  cardMeta: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
    textTransform: 'capitalize',
  },
})
