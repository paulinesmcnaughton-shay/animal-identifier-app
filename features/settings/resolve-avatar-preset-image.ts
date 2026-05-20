import type { AvatarPreset } from '@/features/settings/avatar-presets'
import { getCachedPresetUri } from '@/features/settings/avatar-preset-cache'
import type { ProfileAvatarSource } from '@/features/settings/profile-avatar'

/** Bundled asset, cached file, or remote URL (remote needs network until cached). */
export async function resolveAvatarPresetImage(
  preset: AvatarPreset,
): Promise<ProfileAvatarSource> {
  if (typeof preset.image === 'number') return preset.image

  const cachedUri = await getCachedPresetUri(preset.id)
  if (cachedUri) return { uri: cachedUri }

  return preset.image
}
