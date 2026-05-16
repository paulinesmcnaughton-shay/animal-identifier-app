import { StyleSheet, Text, View } from 'react-native'

import { radius, space, type as typeTokens } from '@/design/tokens'

export type KingdomKey = 'insect' | 'bird' | 'mammal' | 'reptile' | 'amphibian' | 'fish' | 'arachnid' | 'mollusc'

export const KINGDOM: Record<KingdomKey, { bg: string; label: string; emoji: string }> = {
  insect:    { bg: '#FFC93C', label: 'Insect',    emoji: '🦋' },
  bird:      { bg: '#FF6B5B', label: 'Bird',       emoji: '🪶' },
  mammal:    { bg: '#92633A', label: 'Mammal',     emoji: '🐾' },
  reptile:   { bg: '#5BC0EB', label: 'Reptile',    emoji: '🦎' },
  amphibian: { bg: '#A4DE3A', label: 'Amphibian',  emoji: '🐸' },
  fish:      { bg: '#A855F7', label: 'Fish',       emoji: '🐟' },
  arachnid:  { bg: '#A855F7', label: 'Arachnid',   emoji: '🕷️' },
  mollusc:   { bg: '#92633A', label: 'Mollusc',    emoji: '🐚' },
}

interface KingdomBadgeProps {
  kind: KingdomKey
}

export function KingdomBadge({ kind }: KingdomBadgeProps) {
  const { bg, label, emoji } = KINGDOM[kind] ?? { bg: '#7388A0', label: kind, emoji: '🌿' }

  return (
    <View style={[styles.wrap, { backgroundColor: bg }]}>
      <Text style={styles.text}>{emoji} {label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[10],
    paddingVertical: space[4],
    borderRadius: radius.pill,
  },
  text: {
    fontSize: typeTokens.size.caption,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})
