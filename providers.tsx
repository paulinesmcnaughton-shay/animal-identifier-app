import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import React from 'react'
import { StatusBar } from 'expo-status-bar'

import { useColorScheme } from '@/hooks/use-color-scheme'

interface AppProvidersProps {
  children: React.ReactNode
}

/**
 * Root providers: navigation theme, status bar.
 * Add QueryClientProvider, MMKV, etc. here when wired.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const colorScheme = useColorScheme()

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {children}
      <StatusBar style="auto" />
    </ThemeProvider>
  )
}
