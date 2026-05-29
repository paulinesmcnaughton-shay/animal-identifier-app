import { Redirect, useRootNavigationState } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { colors } from '@/design/tokens'
import { cacheAllShufflePresets } from '@/features/settings/avatar-preset-cache'
import { ensureUserAvatar } from '@/features/settings/profile-avatar'
import { syncAccountProfileFromAuth } from '@/features/settings/sync-account-profile'
import { useAuth } from '@/lib/auth/auth-context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

export default function RootIndex() {
  const rootNavigationState = useRootNavigationState()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [bootReady, setBootReady] = useState(false)
  const [pendingOnboarding, setPendingOnboarding] = useState(false)

  useEffect(() => {
    if (authLoading) return

    void (async () => {
      if (!isAuthenticated || !user) {
        setBootReady(true)
        return
      }

      const onboardingPending = (await storage.getString('onboarding.pending')) === 'true'
      if (onboardingPending) {
        setPendingOnboarding(true)
        setBootReady(true)
        return
      }

      // Fast local check first — avoids a network call for returning users
      const locallyComplete = (await storage.getString('profile.onboarding_complete')) === 'true'
      if (!locallyComplete) {
        // Safety net: storage may have been cleared (e.g. reinstall) for an OAuth user
        // who created a Supabase auth account but never finished onboarding.
        const supabase = getSupabaseClient()
        let isComplete = false
        if (supabase) {
          const { data } = await supabase
            .from('profiles')
            .select('onboarding_complete')
            .eq('id', user.id)
            .maybeSingle()
          isComplete = data?.onboarding_complete === true
        }

        if (!isComplete) {
          await storage.set('onboarding.method', 'oauth')
          await storage.set('onboarding.pending', 'true')
          setPendingOnboarding(true)
          setBootReady(true)
          return
        }

        await storage.set('profile.onboarding_complete', 'true')
      }

      await syncAccountProfileFromAuth(user)
      await ensureUserAvatar(user.email)
      void cacheAllShufflePresets()
      setBootReady(true)
    })()
  }, [authLoading, isAuthenticated, user])

  useEffect(() => {
    if (!bootReady || authLoading || !rootNavigationState?.key) return
    void SplashScreen.hideAsync()
  }, [authLoading, bootReady, rootNavigationState?.key])

  if (authLoading || !bootReady || !rootNavigationState?.key) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />
  }

  if (isAuthenticated && pendingOnboarding) {
    return <Redirect href="/(onboarding)/personalize" />
  }

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(onboarding)/welcome'} />
}
