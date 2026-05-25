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
import { isTesterAccount, syncTesterAccountFromEmail } from '@/features/settings/tester-account'
import { storage } from '@/util/storage'

const PROFILE_PHOTO_PATH_KEY = 'settings.profilePhotoPath'
const AVATAR_KIND_KEY = 'settings.avatarKind'
const AVATAR_PRESET_ID_KEY = 'settings.avatarPresetId'
const AVATAR_INITIALIZED_KEY = 'settings.avatarInitialized'

export type ProfileAvatarSource = { uri: string } | number
export type ProfilePhotoSource = 'camera' | 'library' | 'random'

type AvatarKind = 'photo' | 'preset'

/** Tester-only preview for this app session — never persisted. */
let testerSessionAvatar: ProfileAvatarSource | null = null

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

async function isAvatarInitialized(): Promise<boolean> {
  return (await storage.getString(AVATAR_INITIALIZED_KEY)) === 'true'
}

async function markAvatarInitialized(): Promise<void> {
  await storage.set(AVATAR_INITIALIZED_KEY, 'true')
}

export function clearTesterSessionAvatar(): void {
  testerSessionAvatar = null
}

async function resolveAlexAvatarSource(): Promise<ProfileAvatarSource> {
  const preset = getAvatarPreset(TESTER_AVATAR_PRESET_ID)
  if (!preset) throw new Error('Alex Riley avatar preset is missing.')
  return resolveAvatarPresetImage(preset)
}

async function applyTesterSessionAvatar(source: ProfileAvatarSource): Promise<ProfileAvatarSource> {
  testerSessionAvatar = source
  notifyAccountProfileChanged()
  return source
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

async function loadSavedAvatarSource(): Promise<ProfileAvatarSource | null> {
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
    await markAvatarInitialized()
    return { uri: legacyPhoto }
  }

  return null
}

async function recoverStoredPresetAvatar(): Promise<ProfileAvatarSource> {
  const presetId = await storage.getString(AVATAR_PRESET_ID_KEY)
  if (presetId && getAvatarPreset(presetId)) {
    return assignPresetAvatar(presetId as AvatarPresetId)
  }
  return assignPresetAvatar(SHUFFLE_AVATAR_PRESETS[0].id)
}

async function resolveTesterAvatarSource(): Promise<ProfileAvatarSource> {
  if (testerSessionAvatar) return testerSessionAvatar
  return resolveAlexAvatarSource()
}

/** App launch — tester always resets to Alex; real users keep their saved avatar. */
export async function ensureUserAvatar(userEmail?: string | null): Promise<ProfileAvatarSource> {
  await syncTesterAccountFromEmail(userEmail)

  if (await isTesterAccount()) {
    clearTesterSessionAvatar()
    return assignTesterAvatar()
  }

  const saved = await loadSavedAvatarSource()
  if (saved) return saved

  if (await isAvatarInitialized()) {
    return recoverStoredPresetAvatar()
  }

  const assigned = await assignRandomPresetAvatar()
  await markAvatarInitialized()
  return assigned
}

/** Profile UI — real users keep saved avatar; tester uses session preview or Alex. */
export async function resolveProfileAvatarSource(): Promise<ProfileAvatarSource> {
  if (await isTesterAccount()) {
    return resolveTesterAvatarSource()
  }

  const saved = await loadSavedAvatarSource()
  if (saved) return saved

  if (await isAvatarInitialized()) {
    return recoverStoredPresetAvatar()
  }

  const assigned = await assignRandomPresetAvatar()
  await markAvatarInitialized()
  return assigned
}

/** New signup — one random animal avatar, then frozen until the user changes it. */
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
  const preset = getAvatarPreset(TESTER_AVATAR_PRESET_ID)
  if (!preset) throw new Error('Alex Riley avatar preset is missing.')

  await storage.set(AVATAR_KIND_KEY, 'preset')
  await storage.set(AVATAR_PRESET_ID_KEY, TESTER_AVATAR_PRESET_ID)
  await storage.delete(PROFILE_PHOTO_PATH_KEY)
  await markAvatarInitialized()
  notifyAccountProfileChanged()
  return resolveAvatarPresetImage(preset)
}

/** Tester logout — next session starts on Alex Riley again. */
export async function resetTesterAvatarForNextSession(): Promise<void> {
  if (!(await isTesterAccount())) return
  clearTesterSessionAvatar()
  await assignTesterAvatar()
}

export async function assignPresetAvatar(presetId: AvatarPresetId): Promise<ProfileAvatarSource> {
  const preset = getAvatarPreset(presetId)
  if (!preset) throw new Error(`Unknown avatar preset: ${presetId}`)

  await storage.set(AVATAR_KIND_KEY, 'preset')
  await storage.set(AVATAR_PRESET_ID_KEY, presetId)
  await storage.delete(PROFILE_PHOTO_PATH_KEY)
  await markAvatarInitialized()
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

async function assignTesterSessionRandomAvatar(): Promise<ProfileAvatarSource> {
  const presetId = pickRandomAvatarPresetId()
  const preset = getAvatarPreset(presetId) ?? SHUFFLE_AVATAR_PRESETS[0]
  return applyTesterSessionAvatar(await resolveAvatarPresetImage(preset))
}

export async function getProfileAvatarSource(): Promise<ProfileAvatarSource> {
  return resolveProfileAvatarSource()
}

export async function saveProfilePhotoFromPickerUri(sourceUri: string): Promise<string> {
  const destination = profilePhotoFilePath()
  await copyAsync({ from: sourceUri, to: destination })
  await storage.set(PROFILE_PHOTO_PATH_KEY, destination)
  await storage.set(AVATAR_KIND_KEY, 'photo')
  await markAvatarInitialized()
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
    cameraType: ImagePicker.CameraType.front,
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
    if (await isTesterAccount()) {
      if (source === 'random') {
        return assignTesterSessionRandomAvatar()
      }

      const pickedUri = source === 'camera' ? await launchCamera() : await launchLibrary()
      if (!pickedUri) return null

      const destination = profilePhotoFilePath()
      await copyAsync({ from: pickedUri, to: destination })
      return applyTesterSessionAvatar({ uri: destination })
    }

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
