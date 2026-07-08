import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { slideUpSheetHandle, slideUpSheetShell } from '@/design/slide-up-sheet'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

/** The exact wording a user agrees to — stored verbatim with each submission
 *  (features/species/suggest-photo.ts) so it stays legally defensible even if
 *  this copy changes later. Bump CONSENT_VERSION whenever the wording below
 *  materially changes. */
export const CONSENT_VERSION = 'v1'
export const CONSENT_TEXT =
  'By submitting this photo, you confirm it’s yours to share and grant WildKind a permanent, worldwide license to use it in the app — including as the reference photo for this species if approved. This can’t be undone once submitted.'

interface PhotoConsentSheetProps {
  visible: boolean
  speciesName: string
  onSelectCamera: () => void
  onSelectLibrary: () => void
  onCancel: () => void
}

/** Shown before a user shares a photo for a species with no reference image.
 *  Requires an explicit checkbox before either capture option is usable —
 *  see CONSENT_TEXT for the exact legal wording stored with the submission. */
export function PhotoConsentSheet({
  visible,
  speciesName,
  onSelectCamera,
  onSelectLibrary,
  onCancel,
}: PhotoConsentSheetProps) {
  const insets = useSafeAreaInsets()
  const [agreed, setAgreed] = useState(false)

  const handleClose = () => {
    setAgreed(false)
    onCancel()
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      presentationStyle="overFullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable
          style={styles.overlay}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          onPress={handleClose}
        />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space[16] }]}>
          <View style={slideUpSheetHandle} />
          <Text style={styles.title}>Share a Photo</Text>
          <Text style={styles.subtitle}>Help us add a photo of the {speciesName}.</Text>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: agreed }}
            accessibilityLabel="I agree to the photo submission terms"
            onPress={() => setAgreed((v) => !v)}
            style={styles.checkRow}>
            <Ionicons
              name={agreed ? 'checkbox' : 'square-outline'}
              size={20}
              color={agreed ? colors.green : colors.dim}
            />
            <Text style={styles.checkText}>{CONSENT_TEXT}</Text>
          </Pressable>

          <View style={styles.actions}>
            <View style={[styles.popWrap, !agreed && styles.popWrapDisabled]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Take a photo"
                disabled={!agreed}
                onPress={onSelectCamera}
                style={({ pressed }) => [styles.popButton, pressed && agreed && styles.popPressed]}>
                <Ionicons name="camera" size={18} color={colors.card} />
                <Text style={styles.popLabel}>Take Photo</Text>
              </Pressable>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose from photo library"
              disabled={!agreed}
              onPress={onSelectLibrary}
              style={({ pressed }) => [
                styles.libraryButton,
                !agreed && styles.libraryButtonDisabled,
                pressed && agreed && styles.libraryPressed,
              ]}>
              <Text style={[styles.libraryLabel, !agreed && styles.libraryLabelDisabled]}>
                Choose from Library
              </Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={handleClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    ...slideUpSheetShell(),
    paddingHorizontal: space[16],
    paddingTop: space[24],
    gap: space[16],
  },
  title: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: -space[8],
    fontSize: typeTokens.size.bodySM,
    color: colors.ink2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
  },
  checkText: {
    flex: 1,
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink2,
    lineHeight: 18,
  },
  actions: {
    gap: space[8],
  },
  popWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  popWrapDisabled: {
    backgroundColor: colors.hairline,
  },
  popButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
  },
  popPressed: {
    transform: [{ translateY: 2 }],
  },
  popLabel: {
    color: colors.card,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
  },
  libraryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
  },
  libraryButtonDisabled: {
    borderColor: colors.hairline,
  },
  libraryPressed: {
    opacity: 0.7,
  },
  libraryLabel: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.green,
  },
  libraryLabelDisabled: {
    color: colors.dim,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
  cancelText: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
})
