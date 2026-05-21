import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { colors } from '@/design/tokens'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { AuthProvider } from '@/lib/auth/auth-context'

const FaunaLightTheme: Theme = {
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

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : FaunaLightTheme}>
        <AuthProvider>
          {children}
          <StatusBar style="dark" />
        </AuthProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}