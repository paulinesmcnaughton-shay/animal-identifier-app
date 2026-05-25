import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { colors } from '@/design/tokens'
import { ensureDistanceUnitInitialized } from '@/features/settings/distance-unit'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { AuthProvider } from '@/lib/auth/auth-context'

const WildKindLightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.bg,
  },
}

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const colorScheme = useColorScheme()

  useEffect(() => {
    void ensureDistanceUnitInitialized()
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : WildKindLightTheme}>
        <AuthProvider>
          {children}
          <StatusBar style="dark" />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}