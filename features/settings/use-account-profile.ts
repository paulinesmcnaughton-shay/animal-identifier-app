import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import type { AccountProfile } from '@/features/settings/account-profile'
import {
  demoHomeUserProfile,
  fetchAuthenticatedHomeProfile,
  shouldUseDemoProfile,
  type HomeUserProfile,
} from '@/features/settings/fetch-user-profile'
import {
  NEW_USER_BADGES_COUNT,
  NEW_USER_LEVEL,
  NEW_USER_RARE_SPOTTED,
  NEW_USER_SPOTS_CAPTURED,
  NEW_USER_STREAK_DAYS,
  NEW_USER_XP,
  newUserWeeklyQuest,
} from '@/features/profile/home-stats'
import {
  firstNameFromDisplayName,
  loadSettingsPreferences,
} from '@/features/settings/preferences'
import { useAuth } from '@/lib/auth/auth-context'

function profileFromLegacyPrefs(
  prefs: Awaited<ReturnType<typeof loadSettingsPreferences>>,
): HomeUserProfile {
  return demoHomeUserProfile(
    prefs.displayName,
    prefs.username,
    prefs.email,
    prefs.phone,
  )
}

const EMPTY_HOME_PROFILE: HomeUserProfile = {
  displayName: '',
  username: '',
  email: '',
  phone: '',
  firstName: '',
  timeZone: null,
  level: NEW_USER_LEVEL,
  xp: NEW_USER_XP,
  spotsCaptured: NEW_USER_SPOTS_CAPTURED,
  rareSpotted: NEW_USER_RARE_SPOTTED,
  badgesCount: NEW_USER_BADGES_COUNT,
  streakDays: NEW_USER_STREAK_DAYS,
  claimedQuests: [],
  weeklyQuest: newUserWeeklyQuest(),
}

/** @see `features/settings/account-profile.ts` — import `useAccountProfile` from there in app code. */
export function useAccountProfile() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [profile, setProfile] = useState<HomeUserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reload = useCallback(async () => {
    if (authLoading) return

    if (!user || !isAuthenticated) {
      setProfile(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)

    try {
      if (await shouldUseDemoProfile(user)) {
        const prefs = await loadSettingsPreferences()
        setProfile(profileFromLegacyPrefs(prefs))
        return
      }

      const loaded = await fetchAuthenticatedHomeProfile(user)
      setProfile(loaded)
    } finally {
      setIsLoading(false)
    }
  }, [authLoading, user, isAuthenticated])

  useFocusEffect(
    useCallback(() => {
      void reload()
    }, [reload]),
  )

  useEffect(() => {
    void reload()
  }, [reload])

  useEffect(() => subscribeAccountProfile(() => void reload()), [reload])

  const resolved: HomeUserProfile = profile ?? EMPTY_HOME_PROFILE

  return useMemo(
    () => ({
      ...resolved,
      isReady: profile !== null && !isLoading,
      isLoading: isLoading || authLoading,
      reload,
    }),
    [profile, isLoading, authLoading, reload, resolved],
  )
}
