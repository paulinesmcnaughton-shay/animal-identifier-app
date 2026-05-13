import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'

interface AudioPlayerProps {
  title?: string
}

export function AudioPlayer({ title = 'Call' }: AudioPlayerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Play call" style={styles.btn}>
        <Ionicons name="play" size={22} color={colors.card} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: space[12],
    borderRadius: radius.md,
    backgroundColor: colors.ink,
  },
  title: {
    fontSize: typeTokens.size.body,
    fontWeight: '600',
    color: colors.card,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
