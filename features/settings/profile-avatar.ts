import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
} from 'expo-file-system/legacy'
import { Alert } from 'react-native'

import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import {
  getBundledShufflePresetIds,
  getOfflineShufflePresetIds,
} from '@/features/settings/avatar-preset-cache'
import {
  type AvatarPresetId,
  type ShuffleAvatarPresetId,
  getAvatarPreset,
  isShuffleAvatarPresetId,
  pickRandomAvatarPresetId,
  SHUFFLE_AVATAR_PRESETS,
  TESTER_AVATAR_PRESET_ID,
} from '@/features/settings/avatar-presets'
import { resolveAvatarPresetImage } from '@/features/settings/resolve-avatar-preset-image'
import { isTesterAccount } from '@/features/settings/tester-account'
import { storage } from '@/util/storage'

const PROFILE_PHOTO_PATH_KEY = 'settings.profilePhotoPath'
const AVATAR_KIND_KEY = 'settings.avatarKind'
const AVATAR_PRESET_ID_KEY = 'settings.avatarPresetId'

export type ProfileAvatarSource = { uri: string } | number
export type ProfilePhotoSource = 'camera' | 'library' | 'random'

type AvatarKind = 'photo' | 'preset'

function profilePhotoFilePath(): string {
  if (!documentDirectory) {
    throw new Error('Local storage is unavailable.')
  }
  return `${documentDirectory}profile-avatar.jpg`
}

async function readAvatarKind(): Promise<AvatarKind | null> {
  const raw = await storage.getString(AVATAR_KIND_KEY)
  if (raw === 'photo' || raw === 'preset') return raw
  return null
}

export async function loadProfilePhotoUri(): Promise<string | null> {
  try {
    const storedPath = await storage.getString(PROFILE_PHOTO_PATH_KEY)
    if (!storedPath) return null
    const info = await getInfoAsync(storedPath)
    if (!info.exists) {
      await storage.delete(PROFILE_PHOTO_PATH_KEY)
      return null
    }
    return storedPath
  } catch {
    return null
  }
}

async function assignInitialAvatar(): Promise<ProfileAvatarSource> {
  if (await isTesterAccount()) {
    return assignPresetAvatar(TESTER_AVATAR_PRESET_ID)
  }
  return assignRandomPresetAvatar()
}

export async function resolveProfileAvatarSource(): Promise<ProfileAvatarSource> {
  const kind = await readAvatarKind()

  if (kind === 'photo') {
    const uri = await loadProfilePhotoUri()
    if (uri) return { uri }
  }

  if (kind === 'preset') {
    const presetId = await storage.getString(AVATAR_PRESET_ID_KEY)
    const preset = getAvatarPreset(presetId)
    if (preset) return await resolveAvatarPresetImage(preset)
  }

  const legacyPhoto = await loadProfilePhotoUri()
  if (legacyPhoto) {
    await storage.set(AVATAR_KIND_KEY, 'photo')
    return { uri: legacyPhoto }
  }

  return assignInitialAvatar()
}

/** Assign avatar when missing — Alex for tester login, random animal otherwise. */
export async function ensureUserAvatar(): Promise<ProfileAvatarSource> {
  const kind = await readAvatarKind()
  if (kind === 'photo') {
    const uri = await loadProfilePhotoUri()
    if (uri) return { uri }
  }
  if (kind === 'preset') {
    const preset = getAvatarPreset(await storage.getString(AVATAR_PRESET_ID_KEY))
    if (preset) return await resolveAvatarPresetImage(preset)
  }
  return assignInitialAvatar()
}

/** New signup — always a random animal avatar (never Alex). */
export async function assignNewUserAvatar(): Promise<ProfileAvatarSource> {
  const offlineIds = await getOfflineShufflePresetIds()
  const allCount = SHUFFLE_AVATAR_PRESETS.length
  if (offlineIds.length >= allCount) {
    return assignRandomPresetAvatar()
  }
  const bundled = getBundledShufflePresetIds()
  const presetId = pickRandomAvatarPresetId(undefined, bundled)
  return assignPresetAvatar(presetId)
}

export async function assignTesterAvatar(): Promise<ProfileAvatarSource> {
  return assignPresetAvatar(TESTER_AVATAR_PRESET_ID)
}

export async function assignPresetAvatar(presetId: AvatarPresetId): Promise<ProfileAvatarSource> {
  const preset = getAvatarPreset(presetId)
  if (!preset) throw new Error(`Unknown avatar preset: ${presetId}`)

  await storage.set(AVATAR_KIND_KEY, 'preset')
  await storage.set(AVATAR_PRESET_ID_KEY, presetId)
  await storage.delete(PROFILE_PHOTO_PATH_KEY)
  notifyAccountProfileChanged()
  return await resolveAvatarPresetImage(preset)
}

export async function assignRandomPresetAvatar(
  options?: { excludeCurrent?: boolean },
): Promise<ProfileAvatarSource> {
  let excludeId: ShuffleAvatarPresetId | undefined
  if (options?.excludeCurrent) {
    const current = await storage.getString(AVATAR_PRESET_ID_KEY)
    if (isShuffleAvatarPresetId(current)) excludeId = current
  }

  const presetId = pickRandomAvatarPresetId(excludeId)
  const preset = getAvatarPreset(presetId)
  if (preset) return assignPresetAvatar(presetId)
  return assignPresetAvatar(SHUFFLE_AVATAR_PRESETS[0].id)
}

export async function getProfileAvatarSource(): Promise<ProfileAvatarSource> {
  return resolveProfileAvatarSource()
}

export async function saveProfilePhotoFromPickerUri(sourceUri: string): Promise<string> {
  const destination = profilePhotoFilePath()
  await copyAsync({ from: sourceUri, to: destination })
  await storage.set(PROFILE_PHOTO_PATH_KEY, destination)
  await storage.set(AVATAR_KIND_KEY, 'photo')
  return destination
}

async function getImagePicker() {
  return import('expo-image-picker')
}

async function ensureCameraPermission(): Promise<boolean> {
  const ImagePicker = await getImagePicker()
  const current = await ImagePicker.getCameraPermissionsAsync()
  if (current.granted) return true
  const requested = await ImagePicker.requestCameraPermissionsAsync()
  if (requested.granted) return true
  Alert.alert(
    'Camera access needed',
    'Allow camera access to take a profile photo, or use Avatar Shuffle instead.',
  )
  return false
}

async function ensureLibraryPermission(): Promise<boolean> {
  const ImagePicker = await getImagePicker()
  const current = await ImagePicker.getMediaLibraryPermissionsAsync()
  if (current.granted) return true
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (requested.granted) return true
  Alert.alert(
    'Photos access needed',
    'Allow photo library access to choose a profile picture.',
  )
  return false
}

async function launchCamera(): Promise<string | null> {
  if (!(await ensureCameraPermission())) return null
  const ImagePicker = await getImagePicker()
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  })
  if (result.canceled || !result.assets[0]?.uri) return null
  return result.assets[0].uri
}

async function launchLibrary(): Promise<string | null> {
  if (!(await ensureLibraryPermission())) return null
  const ImagePicker = await getImagePicker()
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.85,
  })
  if (result.canceled || !result.assets[0]?.uri) return null
  return result.assets[0].uri
}

/** After the bottom sheet picks camera, library, or avatar shuffle. */
export async function saveProfilePhotoFromSource(
  source: ProfilePhotoSource,
): Promise<ProfileAvatarSource | null> {
  try {
    if (source === 'random') {
      return assignRandomPresetAvatar({ excludeCurrent: true })
    }

    const pickedUri = source === 'camera' ? await launchCamera() : await launchLibrary()
    if (!pickedUri) return null

    const savedPath = await saveProfilePhotoFromPickerUri(pickedUri)
    notifyAccountProfileChanged()
    return { uri: savedPath }
  } catch {
    Alert.alert('Could not save photo', 'Try again with a different image.')
    return null
  }
}
