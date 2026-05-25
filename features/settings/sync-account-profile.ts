import type { User } from '@supabase/supabase-js'

import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import {
  buildUserProfileFromAuth,
  fetchAuthenticatedHomeProfile,
  persistUserProfileLocally,
  setupAvatarForAuthenticatedUser,
  shouldUseDemoProfile,
} from '@/features/settings/fetch-user-profile'
import { setTesterAccount } from '@/features/settings/tester-account'

/** Pull auth + Supabase profile into local settings (replaces Alex Riley demo defaults). */
export async function syncAccountProfileFromAuth(user: User): Promise<void> {
  if (await shouldUseDemoProfile(user)) return

  await setTesterAccount(false)
  const profile = await buildUserProfileFromAuth(user)
  await persistUserProfileLocally(profile)
  notifyAccountProfileChanged()
  await setupAvatarForAuthenticatedUser(user)
}

export { fetchAuthenticatedHomeProfile }
