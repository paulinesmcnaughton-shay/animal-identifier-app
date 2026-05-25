import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

import { type DistanceUnit, loadDistanceUnit } from '@/features/settings/distance-unit'

export function useDistanceUnit(): DistanceUnit {
  const [unit, setUnit] = useState<DistanceUnit>('miles')

  const refresh = useCallback(async () => {
    setUnit(await loadDistanceUnit())
  }, [])

  useFocusEffect(
    useCallback(() => {
      void refresh()
    }, [refresh]),
  )

  return unit
}
