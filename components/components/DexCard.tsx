import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { KINGDOM, type KingdomKey } from '@/design/atoms/KingdomBadge'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

export interface DexCardSpecies {
  id: string
  number: string
  name: string
  date: string
  kingdom: KingdomKey
  gradient: readonly [string, string]
  cornerBadge?: 'NEW' | 'RARE'
  showFootprint?: boolean
}

function useTaxaPhoto(name: string): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&per_page=1`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const photoUrl = data?.results?.[0]?.default_photo?.medium_url ?? null
          setUrl(photoUrl)
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [name])

  return url
}

interface DexCardProps {
  species: DexCardSpecies
  width: number
}

export function DexCard({ species, width }: DexCardProps) {
  const { number, name, date, gradient, cornerBadge, showFootprint, kingdom } = species
  const photoUrl = useTaxaPhoto(name)
  const kingdomBg = KINGDOM[kingdom]?.bg ?? colors.dim

  return (
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
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.card,
    overflow: 'hidden',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
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
    paddingHorizontal: space[10],
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
    paddingVertical: space[2],
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
    paddingHorizontal: space[10],
    paddingVertical: space[10],
    gap: space[2],
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
