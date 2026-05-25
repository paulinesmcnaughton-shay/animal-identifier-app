export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 10

/** Visible label on profile hero — full name stays in accessibility. */
export function truncateProfileDisplayName(
  name: string,
  maxLength = PROFILE_DISPLAY_NAME_MAX_LENGTH,
): string {
  const trimmed = name.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}…`
}
