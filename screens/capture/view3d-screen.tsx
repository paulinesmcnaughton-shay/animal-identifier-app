import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

export function View3DScreen() {
  const insets = useSafeAreaInsets()
  const { name } = useLocalSearchParams<{ name?: string }>()
  const animalName = typeof name === 'string' ? name : 'Unknown species'

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: insets.top + space[8] }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.7 }]}>
          <Ionicons name="close" size={22} color={colors.card} />
        </Pressable>
      </View>

      <View style={styles.center}>
        <Text style={styles.animalName}>{animalName}</Text>
        <Text style={styles.comingSoon}>3D view coming soon</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[16],
    zIndex: 10,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[24],
    gap: space[12],
  },
  animalName: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displayMD,
    fontWeight: typeTokens.display.weight,
    color: colors.card,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  comingSoon: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.plum,
    textAlign: 'center',
  },
})
