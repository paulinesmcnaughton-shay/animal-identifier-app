import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { dexCardHairline } from '@/design/dex-card-shell'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'
import { useTaxaPhoto } from '@/features/species/use-taxa-photo'

export interface DexCardSpecies {
  id: string
  number: string
  name: string
  date: string
  kingdom: KingdomKey
  gradient: readonly [string, string]
  cornerBadge?: 'NEW' | 'RARE'
  showFootprint?: boolean
  photoUri?: string | null
}

interface DexCardProps {
  species: DexCardSpecies
  width: number
  onPress?: () => void
}

export function DexCard({ species, width, onPress }: DexCardProps) {
  const { number, name, date, gradient, cornerBadge, showFootprint, kingdom, photoUri } = species
  const { url: taxaUrl } = useTaxaPhoto(photoUri ? null : name, kingdom)
  const photoUrl = photoUri ?? taxaUrl
  const kingdomBg = KINGDOM[kingdom]?.bg ?? colors.dim

  const card = (
    <View style={[styles.card, { width }]}>
      <View style={[styles.artWrap, { backgroundColor: kingdomBg }]}>

        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[...gradient]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        )}

        {/* Paw / blob — only while no photo */}
        {!photoUrl ? (
          <View style={styles.silhouette}>
            {showFootprint ? (
              <Ionicons name="paw" size={44} color="rgba(255,255,255,0.45)" />
            ) : (
              <View style={styles.blob} />
            )}
          </View>
        ) : null}

        {/* Bottom overlay: number + leaf always visible */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.bottomOverlay}
          pointerEvents="none">
          <View style={styles.metaRow}>
            <Text style={styles.number}>{number}</Text>
            <Ionicons name="leaf-outline" size={14} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>

        {/* Corner badge */}
        {cornerBadge ? (
          <View style={[styles.cornerPill, cornerBadge === 'NEW' ? styles.pillNew : styles.pillRare]}>
            <Text style={styles.cornerPillText}>{cornerBadge}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        {date ? <Text style={styles.date} numberOfLines={1}>{date}</Text> : null}
      </View>
    </View>
  )

  if (!onPress) return card

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${name}, ${number}`}
      onPress={onPress}
      style={({ pressed }) => [pressed && styles.cardPressed]}>
      {card}
    </Pressable>
  )
}

interface DexUnknownCardProps {
  width: number
}

export function DexUnknownCard({ width }: DexUnknownCardProps) {
  return (
    <View style={[styles.card, { width }]}>
      <LinearGradient
        colors={['#C5CCD6', '#9AA5B5']}
        style={[styles.artWrap, styles.unknownInner]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}>
        <Text style={styles.question}>?</Text>
        <Text style={styles.numberMuted}>#005</Text>
      </LinearGradient>
      <View style={styles.footer}>
        <Text style={styles.name}>Unknown</Text>
      </View>
    </View>
  )
}

const ART_HEIGHT = 112

const styles = StyleSheet.create({
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
    ...dexCardHairline,
    ...shadow.card,
  },
  artWrap: {
    height: ART_HEIGHT,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  silhouette: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  bottomOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: space[8],
    paddingTop: space[16],
    paddingBottom: space[8],
    justifyContent: 'flex-end',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  number: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.95)',
  },
  cornerPill: {
    position: 'absolute',
    top: space[8],
    left: space[8],
    paddingHorizontal: space[8],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  pillNew: {
    backgroundColor: 'rgba(255,255,255,0.95)',
  },
  pillRare: {
    backgroundColor: 'rgba(255,201,60,0.95)',
  },
  cornerPillText: {
    fontSize: typeTokens.size.micro,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: 0.5,
  },
  unknownInner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[4],
  },
  question: {
    fontSize: 48,
    fontWeight: '200',
    color: 'rgba(255,255,255,0.75)',
  },
  numberMuted: {
    fontSize: typeTokens.size.caption,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  footer: {
    paddingHorizontal: space[8],
    paddingVertical: space[8],
    gap: space[4],
  },
  name: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: '700',
    color: colors.ink,
  },
  date: {
    fontSize: typeTokens.size.caption,
    fontWeight: '500',
    color: colors.dim,
  },
})
