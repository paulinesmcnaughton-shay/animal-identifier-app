import { Ionicons } from '@expo/vector-icons'
import { CameraView, useCameraPermissions } from 'expo-camera'
import * as Haptics from 'expo-haptics'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import * as MediaLibrary from 'expo-media-library'
import { type Href, router } from 'expo-router'
import { useCallback, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Button } from '@/design/atoms/Button'
import { colors, radius, shadow, space, type as typeTokens } from '@/design/tokens'

type Facing = 'back' | 'front'

export function ScanScreen() {
  const insets = useSafeAreaInsets()
  const cameraRef = useRef<CameraView>(null)
  const [permission, requestPermission] = useCameraPermissions()
  const [facing, setFacing] = useState<Facing>('back')
  const [flashOn, setFlashOn] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [galleryAssets, setGalleryAssets] = useState<MediaLibrary.Asset[]>([])
  const [isLoadingGallery, setIsLoadingGallery] = useState(false)

  const handleClose = useCallback(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(tabs)/home')
  }, [])

  const handleToggleFlash = useCallback(() => {
    setFlashOn((on) => !on)
  }, [])

  const handleFlipCamera = useCallback(() => {
    setFacing((current) => (current === 'back' ? 'front' : 'back'))
  }, [])

  const navigateToResult = useCallback((uri: string) => {
    router.push({
      pathname: '/capture/result',
      params: { uri },
    } as Href)
  }, [])

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isCapturing) return
    setIsCapturing(true)
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 })
      if (photo?.uri) navigateToResult(photo.uri)
    } finally {
      setIsCapturing(false)
    }
  }, [isCapturing, navigateToResult])

  const handleOpenGallery = useCallback(async () => {
    setIsLoadingGallery(true)
    try {
      const { status } = await MediaLibrary.requestPermissionsAsync()
      if (status !== 'granted') return
      const page = await MediaLibrary.getAssetsAsync({
        first: 48,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime],
      })
      setGalleryAssets(page.assets)
      setGalleryOpen(true)
    } finally {
      setIsLoadingGallery(false)
    }
  }, [])

  const handleSelectGalleryAsset = useCallback(
    async (asset: MediaLibrary.Asset) => {
      setGalleryOpen(false)
      const info = await MediaLibrary.getAssetInfoAsync(asset, {
        shouldDownloadFromNetwork: true,
      })
      const uri = info.localUri ?? asset.uri
      navigateToResult(uri)
    },
    [navigateToResult],
  )

  if (!permission) {
    return (
      <View style={[styles.centered, styles.darkScreen]}>
        <ActivityIndicator color={colors.card} />
      </View>
    )
  }

  if (!permission.granted) {
    const canAskAgain = permission.canAskAgain !== false
    const handleEnableCamera = () => {
      if (canAskAgain) void requestPermission()
      else void Linking.openSettings()
    }

    return (
      <View style={[styles.centered, styles.darkScreen, styles.permissionScreen]}>
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          {canAskAgain
            ? 'Wildr uses your camera to identify animals and insects in the wild.'
            : 'Camera was turned off for Wildr. Open Settings → Privacy & Security → Camera and enable Wildr, or tap below.'}
        </Text>
        <Button
          label={canAskAgain ? 'Allow camera' : 'Open Settings'}
          onPress={handleEnableCamera}
          style={styles.permissionButton}
        />
        {canAskAgain ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={handleClose}
            style={styles.permissionBack}>
            <Text style={styles.permissionBackText}>Not now</Text>
          </Pressable>
        ) : null}
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        enableTorch={flashOn}
      />

      <LinearGradient
        colors={['rgba(21,33,48,0.55)', 'transparent']}
        style={[styles.topGradient, { paddingTop: insets.top + space[8] }]}
        pointerEvents="box-none">
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close camera"
            onPress={handleClose}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}>
            <Ionicons name="close" size={24} color={colors.card} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={flashOn ? 'Turn flash off' : 'Turn flash on'}
            onPress={handleToggleFlash}
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconPressed]}>
            <Ionicons name={flashOn ? 'flash' : 'flash-off'} size={22} color={colors.card} />
          </Pressable>
        </View>
      </LinearGradient>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={[styles.bottomGradient, { paddingBottom: insets.bottom + space[16] }]}
        pointerEvents="box-none">
        <View style={styles.bottomBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Choose from photo library"
            onPress={handleOpenGallery}
            disabled={isLoadingGallery}
            style={({ pressed }) => [styles.sideControl, pressed && styles.iconPressed]}>
            {isLoadingGallery ? (
              <ActivityIndicator color={colors.card} size="small" />
            ) : (
              <Ionicons name="images-outline" size={28} color={colors.card} />
            )}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            onPress={handleCapture}
            disabled={isCapturing}
            style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}>
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Flip camera"
            onPress={handleFlipCamera}
            style={({ pressed }) => [styles.sideControl, pressed && styles.iconPressed]}>
            <Ionicons name="camera-reverse-outline" size={28} color={colors.card} />
          </Pressable>
        </View>
      </LinearGradient>

      <GalleryPickerModal
        visible={galleryOpen}
        assets={galleryAssets}
        onClose={() => setGalleryOpen(false)}
        onSelect={handleSelectGalleryAsset}
      />
    </View>
  )
}

interface GalleryPickerModalProps {
  visible: boolean
  assets: MediaLibrary.Asset[]
  onClose: () => void
  onSelect: (asset: MediaLibrary.Asset) => void
}

function GalleryPickerModal({ visible, assets, onClose, onSelect }: GalleryPickerModalProps) {
  const insets = useSafeAreaInsets()
  const { width } = useWindowDimensions()
  const cellSize = (width - space[16] * 2 - space[4] * 2) / 3

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.modalSheet, { paddingBottom: insets.bottom + space[16] }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Recent photos</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close gallery"
              onPress={onClose}
              style={({ pressed }) => [styles.modalClose, pressed && styles.iconPressed]}>
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>
          <FlatList
            data={assets}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperStyle={styles.galleryRow}
            contentContainerStyle={styles.galleryList}
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select photo"
                onPress={() => onSelect(item)}
                style={({ pressed }) => [
                  styles.galleryCell,
                  { width: cellSize, height: cellSize },
                  pressed && styles.galleryCellPressed,
                ]}>
                <Image source={{ uri: item.uri }} style={styles.galleryThumb} contentFit="cover" />
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.galleryEmpty}>No photos found in your library.</Text>
            }
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.ink,
  },
  darkScreen: {
    backgroundColor: colors.ink,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionScreen: {
    paddingHorizontal: space[24],
  },
  permissionTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.display.weight,
    color: colors.card,
    textAlign: 'center',
    marginBottom: space[12],
  },
  permissionBody: {
    fontSize: typeTokens.size.bodyLG,
    color: colors.dim,
    textAlign: 'center',
    marginBottom: space[32],
    lineHeight: 24,
  },
  permissionButton: {
    alignSelf: 'stretch',
  },
  permissionBack: {
    marginTop: space[16],
    paddingVertical: space[12],
  },
  permissionBackText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: space[16],
    paddingBottom: space[24],
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  iconPressed: {
    opacity: 0.75,
  },
  bottomGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: space[56],
    paddingHorizontal: space[24],
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideControl: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    borderWidth: 3,
    borderColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    ...shadow.pop,
  },
  shutterPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.9,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(21,33,48,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '72%',
    backgroundColor: colors.bg,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    paddingTop: space[16],
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[16],
    marginBottom: space[12],
  },
  modalTitle: {
    fontFamily: typeTokens.display.family,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.display.weight,
    color: colors.ink,
  },
  modalClose: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  galleryList: {
    paddingHorizontal: space[16],
    paddingBottom: space[8],
    gap: space[4],
  },
  galleryRow: {
    gap: space[4],
    marginBottom: space[4],
  },
  galleryCell: {
    borderRadius: radius.sm,
    overflow: 'hidden',
    backgroundColor: colors.hairline,
  },
  galleryCellPressed: {
    opacity: 0.85,
  },
  galleryThumb: {
    width: '100%',
    height: '100%',
  },
  galleryEmpty: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
    textAlign: 'center',
    paddingVertical: space[32],
  },
})
