import { SETTINGS_DEFAULTS } from '@/features/settings/preferences'
import { storage } from '@/util/storage'

/** Set on login (tester) vs signup (new user). */
export const TESTER_ACCOUNT_STORAGE_KEY = 'account.isTester'

/** Demo account — Alex Riley avatar resets on every app launch and logout. */
export const TESTER_ACCOUNT_EMAIL = SETTINGS_DEFAULTS.email.trim().toLowerCase()

/** Last signed-in email — used to detect the Alex Riley tester account reliably. */
export const AUTH_USER_EMAIL_KEY = 'auth.userEmail'

export async function setTesterAccount(isTester: boolean): Promise<void> {
  await storage.set(TESTER_ACCOUNT_STORAGE_KEY, isTester ? 'true' : 'false')
}

export async function isTesterAccount(): Promise<boolean> {
  if ((await storage.getString(TESTER_ACCOUNT_STORAGE_KEY)) === 'true') return true
  const storedEmail = await storage.getString(AUTH_USER_EMAIL_KEY)
  return isTesterEmail(storedEmail)
}

export function isTesterEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return email.trim().toLowerCase() === TESTER_ACCOUNT_EMAIL
}

export async function syncTesterAccountFromEmail(email: string | null | undefined): Promise<void> {
  if (!email) return
  await setTesterAccount(isTesterEmail(email))
}
