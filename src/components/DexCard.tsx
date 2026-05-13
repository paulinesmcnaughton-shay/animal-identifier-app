import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

export interface DexCardSpecies {
  id: string
  number: string
  name: string
  date: string
  gradient: readonly [string, string]
  cornerBadge?: 'NEW' | 'RARE'
  /** small paw / leaf icon in art area — optional */
  showFootprint?: boolean
}

interface DexCardProps {
  species: DexCardSpecies
  width: number
}

export function DexCard({ species, width }: DexCardProps) {
  const { number, name, date, gradient, cornerBadge, showFootprint } = species

  return (
    <View style={[styles.card, { width }]}>
      <View style={styles.artWrap}>
        <LinearGradient colors={[...gradient]} style={styles.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          {cornerBadge ? (
            <View style={[styles.cornerPill, cornerBadge === 'NEW' ? styles.pillNew : styles.pillRare]}>
              <Text style={styles.cornerPillText}>{cornerBadge}</Text>
            </View>
          ) : null}
          <View style={styles.silhouette}>
            {showFootprint ? (
              <Ionicons name="paw" size={44} color="rgba(255,255,255,0.45)" />
            ) : (
              <View style={styles.blob} />
            )}
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.number}>{number}</Text>
            <Ionicons name="leaf-outline" size={14} color="rgba(255,255,255,0.85)" />
          </View>
        </LinearGradient>
      </View>
      <View style={styles.footer}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {date ? (
          <Text style={styles.date} numberOfLines={1}>
            {date}
          </Text>
        ) : null}
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
        style={[styles.gradient, styles.unknownInner]}
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
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
    overflow: 'hidden',
  },
  gradient: {
    height: 112,
    paddingHorizontal: space[10],
    paddingTop: space[10],
    paddingBottom: space[8],
    justifyContent: 'space-between',
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
  cornerPill: {
    alignSelf: 'flex-start',
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
  silhouette: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blob: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.35)',
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
