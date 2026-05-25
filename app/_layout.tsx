import 'react-native-gesture-handler'
import 'react-native-reanimated'

import Mapbox from '@rnmapbox/maps'
import Constants from 'expo-constants'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { AppProviders } from '@/providers'
import { colors } from '@/design/tokens'

Mapbox.setAccessToken(Constants.expoConfig?.extra?.mapboxToken ?? '')

void SplashScreen.preventAutoHideAsync().catch(() => {})

export const unstable_settings = {
  anchor: '(tabs)',
}

/** No slide on cold start — only stack pushes (capture, species, etc.) animate. */
const instantStackScreen = { animation: 'none' as const }

/** Apple-style camera: full screen, slides up from bottom (not from the right). */
const captureScanScreen = {
  headerShown: false,
  presentation: 'fullScreenModal' as const,
  animation: 'slide_from_bottom' as const,
  gestureEnabled: true,
  gestureDirection: 'vertical' as const,
  contentStyle: { backgroundColor: colors.ink },
}

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={instantStackScreen} />
        <Stack.Screen name="(tabs)" options={instantStackScreen} />
        <Stack.Screen name="(onboarding)" options={instantStackScreen} />
        <Stack.Screen name="capture/scan" options={captureScanScreen} />
        <Stack.Screen name="capture/result" />
        <Stack.Screen name="capture/upload" />
        <Stack.Screen name="capture/view3d" />
        <Stack.Screen name="identify/manual-picker" />
        <Stack.Screen
          name="species/[id]"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen name="dex/search" />
        <Stack.Screen name="settings" />
        <Stack.Screen
          name="settings-account"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-wildkind-pro"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-notifications"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-camera-quality"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-appearance"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-dex-layout"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-sightings-visibility"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="settings-distance-unit"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="notifications"
          options={{ contentStyle: { backgroundColor: colors.bg } }}
        />
        <Stack.Screen
          name="badges"
          options={{
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: colors.bg },
          }}
        />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  )
}
