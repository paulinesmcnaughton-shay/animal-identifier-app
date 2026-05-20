import {
  documentDirectory,
  downloadAsync,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy'

import {
  AVATAR_SHUFFLE_CATALOG,
  type ShuffleAvatarPresetId,
} from '@/features/settings/avatar-shuffle-catalog'
import { storage } from '@/util/storage'

const CACHE_INDEX_KEY = 'settings.avatarPresetCacheIndex'

type CacheIndex = Record<string, string>

function cacheDirectory(): string {
  if (!documentDirectory) throw new Error('Local storage is unavailable.')
  return `${documentDirectory}avatar-presets`
}

function cacheFilePath(presetId: string): string {
  return `${cacheDirectory()}/${presetId}.jpg`
}

async function readCacheIndex(): Promise<CacheIndex> {
  const raw = await storage.getString(CACHE_INDEX_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as CacheIndex
  } catch {
    return {}
  }
}

async function writeCacheIndex(index: CacheIndex): Promise<void> {
  await storage.set(CACHE_INDEX_KEY, JSON.stringify(index))
}

export function isBundledShufflePresetId(id: string): boolean {
  const entry = AVATAR_SHUFFLE_CATALOG.find((item) => item.id === id)
  return entry !== undefined && typeof entry.image === 'number'
}

/** Presets that work without network (bundled in app binary). */
export function getBundledShufflePresetIds(): ShuffleAvatarPresetId[] {
  return AVATAR_SHUFFLE_CATALOG.filter((entry) => typeof entry.image === 'number').map(
    (entry) => entry.id,
  )
}

export async function getCachedPresetUri(presetId: string): Promise<string | null> {
  const index = await readCacheIndex()
  const path = index[presetId]
  if (!path) return null
  const info = await getInfoAsync(path)
  if (!info.exists) {
    const next = { ...index }
    delete next[presetId]
    await writeCacheIndex(next)
    return null
  }
  return path
}

/** Bundled + downloaded presets available without network. */
export async function getOfflineShufflePresetIds(): Promise<ShuffleAvatarPresetId[]> {
  const index = await readCacheIndex()
  const ids = new Set<ShuffleAvatarPresetId>(getBundledShufflePresetIds())
  for (const entry of AVATAR_SHUFFLE_CATALOG) {
    if (typeof entry.image === 'number') continue
    const path = index[entry.id]
    if (!path) continue
    const info = await getInfoAsync(path)
    if (info.exists) ids.add(entry.id)
  }
  return [...ids]
}

async function cacheRemotePreset(presetId: string, remoteUri: string): Promise<string | null> {
  const dir = cacheDirectory()
  await makeDirectoryAsync(dir, { intermediates: true })
  const destination = cacheFilePath(presetId)
  try {
    const result = await downloadAsync(remoteUri, destination)
    const index = await readCacheIndex()
    index[presetId] = result.uri
    await writeCacheIndex(index)
    return result.uri
  } catch {
    return null
  }
}

/** Download remote shuffle images for offline use (call when online). */
export async function cacheAllShufflePresets(): Promise<void> {
  await Promise.all(
    AVATAR_SHUFFLE_CATALOG.map(async (entry) => {
      if (typeof entry.image === 'number') return
      const existing = await getCachedPresetUri(entry.id)
      if (existing) return
      await cacheRemotePreset(entry.id, entry.image.uri)
    }),
  )
}
