import { useFocusEffect, usePathname } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { mockUser } from '@/data/mock'
import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import {
  SETTINGS_DEFAULTS,
  firstNameFromDisplayName,
  loadSettingsPreferences,
} from '@/features/settings/preferences'

interface ProfileState {
  displayName: string
  username: string
  email: string
  phone: string
  firstName: string
  level: number
}

function profileFromPrefs(
  prefs: Awaited<ReturnType<typeof loadSettingsPreferences>>,
): ProfileState {
  return {
    displayName: prefs.displayName,
    username: prefs.username,
    email: prefs.email,
    phone: prefs.phone,
    firstName: firstNameFromDisplayName(prefs.displayName),
    level: mockUser.level,
  }
}

const INITIAL: ProfileState = {
  displayName: SETTINGS_DEFAULTS.displayName,
  username: SETTINGS_DEFAULTS.username,
  email: SETTINGS_DEFAULTS.email,
  phone: SETTINGS_DEFAULTS.phone,
  firstName: firstNameFromDisplayName(SETTINGS_DEFAULTS.displayName),
  level: mockUser.level,
}

/** @see `features/settings/account-profile.ts` — import `useAccountProfile` from there in app code. */
export function useAccountProfile() {
  const pathname = usePathname()
  const [profile, setProfile] = useState<ProfileState>(INITIAL)

  const reload = useCallback(async () => {
    const prefs = await loadSettingsPreferences(mockUser.level)
    setProfile(profileFromPrefs(prefs))
  }, [])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload]),
  )

  useEffect(() => {
    void reload()
  }, [pathname, reload])

  useEffect(() => subscribeAccountProfile(() => void reload()), [reload])

  return useMemo(
    () => ({
      ...profile,
      reload,
    }),
    [profile, reload],
  )
}
