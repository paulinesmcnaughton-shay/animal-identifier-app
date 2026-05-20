const PLACEHOLDER_DEX_NUMBERS = new Set(['#???', '#??', '???', ''])

export function isPlaceholderDexNumber(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_DEX_NUMBERS.has(value.trim())
}

export function resolveDexNumber(
  override: string | undefined,
  remote: string | undefined,
  fallback: string,
): string {
  if (override && !isPlaceholderDexNumber(override)) return override.trim()
  if (remote?.trim()) return remote.trim()
  return fallback
}
