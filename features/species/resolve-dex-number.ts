import {
  isPlaceholderDexNumber,
  resolveGlobalDexNumber,
  type DexNumberInput,
} from '@/features/species/dex-number-registry'

export { isPlaceholderDexNumber }

export function resolveDexNumber(
  override: string | undefined,
  remote: string | undefined,
  fallback: string,
  registryInput?: Omit<DexNumberInput, 'dexNumberOverride'>,
): string {
  if (override && !isPlaceholderDexNumber(override)) return override.trim()
  if (remote?.trim() && !isPlaceholderDexNumber(remote)) return remote.trim()
  if (fallback && !isPlaceholderDexNumber(fallback)) return fallback.trim()
  if (registryInput) {
    return resolveGlobalDexNumber({ ...registryInput, dexNumberOverride: undefined })
  }
  return fallback
}
