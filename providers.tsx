import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { StatusBar } from 'expo-status-bar'
import React from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

import { useColorScheme } from '@/hooks/use-color-scheme'

interface AppProvidersProps {
  children: React.ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  const colorScheme = useColorScheme()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        {children}
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  )
}
