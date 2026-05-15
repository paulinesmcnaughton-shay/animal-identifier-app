import { Redirect } from 'expo-router'
import { useEffect, useState } from 'react'
import { View } from 'react-native'

import { colors } from '@/design/tokens'
import { storage } from '@/util/storage'

export default function RootIndex() {
  const [ready, setReady] = useState(false)
  const [hasOnboarded, setHasOnboarded] = useState(false)

  useEffect(() => {
    storage.getString('isLoggedIn').then((val) => {
      setHasOnboarded(val === 'true')
      setReady(true)
    })
  }, [])

  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg }} />
  return <Redirect href={hasOnboarded ? '/home' : '/welcome'} />
}
