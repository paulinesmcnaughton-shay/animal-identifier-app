import { Ionicons } from '@expo/vector-icons'
import { Image, type ImageSource } from 'expo-image'
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface SpeciesPhotoLightboxProps {
  visible: boolean
  source: ImageSource | null
  speciesName: string
  onClose: () => void
}

export function SpeciesPhotoLightbox({
  visible,
  source,
  speciesName,
  onClose,
}: SpeciesPhotoLightboxProps) {
  const insets = useSafeAreaInsets()
  const { width, height } = useWindowDimensions()
  const frameWidth = width - space[16] * 2
  const frameHeight = height - insets.top - insets.bottom - 100

  if (!source) return null

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close full-size photo"
          style={StyleSheet.absoluteFill}
          onPress={onClose}>
          <View style={styles.backdrop} />
        </Pressable>

        <View style={[styles.header, { paddingTop: insets.top + space[8] }]} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            onPress={onClose}
            hitSlop={12}
            style={({ pressed }) => [styles.closeBtn, pressed && styles.pressed]}>
            <Ionicons name="close" size={24} color={colors.card} />
          </Pressable>
          <Text style={styles.title} numberOfLines={2}>
            {speciesName}
          </Text>
        </View>

        <View
          style={[styles.imageFrame, { width: frameWidth, height: frameHeight }]}
          pointerEvents="none">
          <Image
            source={source}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={`Full photo of ${speciesName}`}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(21, 33, 48, 0.92)',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingHorizontal: space[16],
    paddingBottom: space[8],
    zIndex: 2,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  title: {
    flex: 1,
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.bodyLG,
    fontWeight: typeTokens.display.weight,
    color: colors.card,
  },
  imageFrame: {
    zIndex: 1,
  },
})
