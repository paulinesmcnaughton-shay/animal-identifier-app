const USERNAME_PATTERN = /^[a-zA-Z0-9_-]+$/

/** Strip spaces and @ prefix while the user types. */
export function sanitizeUsernameInput(value: string): string {
  return value.replace(/^@+/, '').replace(/\s/g, '')
}

export function normalizeUsername(value: string): string {
  return sanitizeUsernameInput(value.trim())
}

export function getUsernameValidationError(value: string): string | null {
  const normalized = normalizeUsername(value)

  if (!normalized) return 'Add a username.'
  if (/\s/.test(value)) return 'Usernames cannot contain spaces.'
  if (!USERNAME_PATTERN.test(normalized)) {
    return 'Use letters, numbers, underscores, and dashes only.'
  }
  if (normalized.length < 3) return 'Usernames need at least 3 characters.'

  return null
}
