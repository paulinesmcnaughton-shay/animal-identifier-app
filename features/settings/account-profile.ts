/**
 * Account profile — single source of truth for display name, username, email & phone.
 *
 * **UI (React):** `useAccountProfile()` — auto-refreshes on tab focus, navigation, and after saves.
 *
 * **Non-UI / one-off reads:** `loadAccountProfile()` — e.g. server actions, analytics (use sparingly in screens).
 *
 * **Writes:** `updateAccountProfile()` only — never call individual save* helpers from features.
 *
 * Do not use `mockUser` or hardcoded names for identity. New screens that show the user import from here.
 */

import type { User } from '@supabase/supabase-js'

import { mockUser } from '@/data/mock'
import { getSupabaseClient } from '@/lib/supabase/client'
import { notifyAccountProfileChanged } from './account-profile-events'
import {
  buildUserProfileFromAuth,
  shouldUseDemoProfile,
} from './fetch-user-profile'
import {
  firstNameFromDisplayName,
  loadSettingsPreferences,
  saveDisplayName,
  saveEmail,
  savePhone,
  saveUsername,
} from './preferences'

export type { SettingsPreferences } from './preferences'
export { SETTINGS_DEFAULTS, firstNameFromDisplayName, formatAccountSubtitle } from './preferences'
export { useAccountProfile } from './use-account-profile'
export { notifyAccountProfileChanged, subscribeAccountProfile } from './account-profile-events'

export interface AccountProfile {
  displayName: string
  username: string
  email: string
  phone: string
  firstName: string
  level: number
}

export interface UpdateAccountProfileInput {
  displayName: string
  username: string
  email: string
  phone: string
}

export async function loadAccountProfile(
  level = mockUser.level,
  user: User | null = null,
): Promise<AccountProfile> {
  if (user && !(await shouldUseDemoProfile(user))) {
    return buildUserProfileFromAuth(user)
  }

  const prefs = await loadSettingsPreferences(level)
  return {
    displayName: prefs.displayName,
    username: prefs.username,
    email: prefs.email,
    phone: prefs.phone,
    firstName: firstNameFromDisplayName(prefs.displayName),
    level,
  }
}

/** Persist profile fields and refresh every `useAccountProfile()` subscriber. */
export async function updateAccountProfile(input: UpdateAccountProfileInput): Promise<void> {
  await saveDisplayName(input.displayName)
  await saveUsername(input.username)
  await saveEmail(input.email)
  await savePhone(input.phone)

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id
    if (userId) {
      await supabase
        .from('profiles')
        .update({ username: input.username })
        .eq('id', userId)
    }
  }

  notifyAccountProfileChanged()
}
