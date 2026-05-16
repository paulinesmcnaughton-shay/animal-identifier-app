import 'react-native-gesture-handler'
import 'react-native-reanimated'

import Mapbox from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'

import { AppProviders } from '@/providers'

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '')

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync()
  }, [])

  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="capture/scan" />
        <Stack.Screen name="capture/result" />
        <Stack.Screen name="capture/upload" />
        <Stack.Screen name="capture/view3d" />
        <Stack.Screen name="species/[id]" />
        <Stack.Screen name="dex/search" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  )
}
