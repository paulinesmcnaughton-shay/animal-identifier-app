import { Redirect, useRootNavigationState } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { colors } from '@/design/tokens'
import { cacheAllShufflePresets } from '@/features/settings/avatar-preset-cache'
import { ensureUserAvatar } from '@/features/settings/profile-avatar'
import { syncAccountProfileFromAuth } from '@/features/settings/sync-account-profile'
import { useAuth } from '@/lib/auth/auth-context'

export default function RootIndex() {
  const rootNavigationState = useRootNavigationState()
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [bootReady, setBootReady] = useState(false)

  useEffect(() => {
    if (authLoading) return

    void (async () => {
      if (isAuthenticated && user) {
        await syncAccountProfileFromAuth(user)
        await ensureUserAvatar(user.email)
        void cacheAllShufflePresets()
      }
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

  return <Redirect href={isAuthenticated ? '/(tabs)/home' : '/(onboarding)/welcome'} />
}
