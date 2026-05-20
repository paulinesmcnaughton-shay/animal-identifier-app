import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { slideUpSheetRadius } from '@/design/slide-up-sheet'
import { type as typeTokens } from '@/design/tokens'

interface ProfilePhotoPickerSheetProps {
  visible: boolean
  onClose: () => void
  onSelectCamera: () => void
  onSelectLibrary: () => void
  onSelectRandom: () => void
}

const SHEET = {
  overlay: 'rgba(0, 0, 0, 0.4)',
  background: '#F2F2F7',
  rowBg: '#FFFFFF',
  separator: 'rgba(60, 60, 67, 0.29)',
  action: '#007AFF',
} as const

const ROW_HEIGHT = 56
const BLOCK_GAP = 8

function SheetRow({
  label,
  onPress,
  showSeparator,
  isCancel,
}: {
  label: string
  onPress: () => void
  showSeparator?: boolean
  isCancel?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <Text style={[styles.rowLabel, isCancel && styles.cancelLabel]}>{label}</Text>
      {showSeparator ? <View style={styles.separator} /> : null}
    </Pressable>
  )
}

/** Full-width bottom sheet — Take Photo / Photo Library / Cancel. */
export function ProfilePhotoPickerSheet({
  visible,
  onClose,
  onSelectCamera,
  onSelectLibrary,
  onSelectRandom,
}: ProfilePhotoPickerSheetProps) {
  const insets = useSafeAreaInsets()
  const { width: screenWidth } = useWindowDimensions()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.overlay}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              width: screenWidth,
              paddingBottom: insets.bottom,
            },
          ]}>
          <View style={styles.actionsBlock}>
            <SheetRow label="Take Photo" onPress={onSelectCamera} showSeparator />
            <SheetRow label="Photo Library" onPress={onSelectLibrary} showSeparator />
            <SheetRow label="Avatar Shuffle" onPress={onSelectRandom} />
          </View>
          <View style={styles.gap} />
          <View style={styles.cancelBlock}>
            <SheetRow label="Cancel" onPress={onClose} isCancel />
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: SHEET.overlay,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: SHEET.background,
    ...slideUpSheetRadius,
    overflow: 'hidden',
  },
  actionsBlock: {
    width: '100%',
    backgroundColor: SHEET.rowBg,
  },
  gap: {
    height: BLOCK_GAP,
    width: '100%',
    backgroundColor: SHEET.background,
  },
  cancelBlock: {
    width: '100%',
    backgroundColor: SHEET.rowBg,
  },
  row: {
    width: '100%',
    height: ROW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SHEET.rowBg,
  },
  rowPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  separator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: SHEET.separator,
  },
  rowLabel: {
    fontSize: 20,
    fontWeight: typeTokens.body.weights.regular,
    color: SHEET.action,
  },
  cancelLabel: {
    fontWeight: '600',
  },
})
