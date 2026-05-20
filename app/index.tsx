import { Redirect, useRootNavigationState } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { colors } from '@/design/tokens'
import { cacheAllShufflePresets } from '@/features/settings/avatar-preset-cache'
import { ensureUserAvatar } from '@/features/settings/profile-avatar'
import { storage } from '@/util/storage'

export default function RootIndex() {
  const rootNavigationState = useRootNavigationState()
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    void (async () => {
      const val = await storage.getString('isLoggedIn')
      const loggedIn = val === 'true'
      if (loggedIn) {
        await ensureUserAvatar()
        void cacheAllShufflePresets()
      }
      setHasOnboarded(loggedIn)
      setReady(true)
    })()
  }, [])

  useEffect(() => {
    if (!ready || !rootNavigationState?.key) return
    void SplashScreen.hideAsync()
  }, [ready, rootNavigationState?.key])

  if (!ready || !rootNavigationState?.key) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />
  }

  return <Redirect href={hasOnboarded ? '/(tabs)/home' : '/(onboarding)/welcome'} />
}
