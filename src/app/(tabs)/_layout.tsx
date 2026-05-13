import { type Href, Tabs, usePathname, useRouter } from 'expo-router'
import React, { useCallback, useMemo } from 'react'

import BottomNav from '@/src/components/BottomNav'

type Tab = 'spot' | 'dex' | 'map' | 'me'

const hrefByTab: Record<Tab, Href> = {
  spot: '/home',
  dex: '/dex',
  map: '/map',
  me: '/me',
}

function resolveActiveTab(pathname: string): Tab {
  if (pathname.startsWith('/dex')) return 'dex'
  if (pathname === '/map') return 'map'
  if (pathname === '/me') return 'me'
  return 'spot'
}

function TabBarWithNavigation() {
  const pathname = usePathname()
  const router = useRouter()

  const activeTab = useMemo(() => resolveActiveTab(pathname), [pathname])

  const handleTabPress = useCallback(
    (tab: Tab) => {
      router.navigate(hrefByTab[tab])
    },
    [router],
  )

  const handleCapture = useCallback(() => {
    router.push('/capture/scan' as Href)
  }, [router])

  return (
    <BottomNav activeTab={activeTab} onTabPress={handleTabPress} onCapture={handleCapture} />
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarIcon: () => null,
      }}
      tabBar={() => <TabBarWithNavigation />}>
      <Tabs.Screen
        name="index"
        options={{
          title: '',
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen name="home" options={{ title: 'Spot' }} />
      <Tabs.Screen name="dex" options={{ title: 'Dex' }} />
      <Tabs.Screen name="map" options={{ title: 'Map' }} />
      <Tabs.Screen name="me" options={{ title: 'Me' }} />
    </Tabs>
  )
}
