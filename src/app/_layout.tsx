import 'react-native-reanimated'

import { Stack } from 'expo-router'

import { AppProviders } from '@/src/providers'

export const unstable_settings = {
  anchor: '(tabs)',
}

export default function RootLayout() {
  return (
    <AppProviders>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
    </AppProviders>
  )
}
