import {
  AVATAR_SHUFFLE_CATALOG,
  type ShuffleAvatarPresetId,
} from '@/features/settings/avatar-shuffle-catalog'

export type { ShuffleAvatarPresetId } from '@/features/settings/avatar-shuffle-catalog'
export { AVATAR_SHUFFLE_CATALOG } from '@/features/settings/avatar-shuffle-catalog'

export type AvatarPresetId = 'alex' | ShuffleAvatarPresetId

/** Tester profile photo only — not used for new signups or Avatar Shuffle. */
export const TESTER_AVATAR_PRESET_ID: AvatarPresetId = 'alex'

export interface AvatarPreset {
  id: AvatarPresetId
  label: string
  image: number | { uri: string }
}

const TESTER_AVATAR_PRESET: AvatarPreset = {
  id: 'alex',
  label: 'Alex Riley',
  image: require('@/assets/images/profile-alex-riley.png'),
}

/** Animal avatars only — used by Avatar Shuffle (not the default profile photo). */
export const SHUFFLE_AVATAR_PRESETS: AvatarPreset[] = AVATAR_SHUFFLE_CATALOG.map((entry) => ({
  id: entry.id,
  label: entry.label,
  image: entry.image,
}))

export const AVATAR_PRESETS: AvatarPreset[] = [TESTER_AVATAR_PRESET, ...SHUFFLE_AVATAR_PRESETS]

export function getAvatarPreset(id: string | null | undefined): AvatarPreset | undefined {
  return AVATAR_PRESETS.find((preset) => preset.id === id)
}

export function isShuffleAvatarPresetId(id: string | null | undefined): id is ShuffleAvatarPresetId {
  return SHUFFLE_AVATAR_PRESETS.some((preset) => preset.id === id)
}

export function pickRandomAvatarPresetId(
  excludeId?: ShuffleAvatarPresetId,
  poolIds?: ShuffleAvatarPresetId[],
): ShuffleAvatarPresetId {
  const basePool = poolIds ?? SHUFFLE_AVATAR_PRESETS.map((preset) => preset.id)
  const pool = excludeId ? basePool.filter((id) => id !== excludeId) : basePool
  const fallback = poolIds?.[0] ?? SHUFFLE_AVATAR_PRESETS[0].id
  if (pool.length === 0) return fallback as ShuffleAvatarPresetId
  const index = Math.floor(Math.random() * pool.length)
  return pool[index] as ShuffleAvatarPresetId
}
