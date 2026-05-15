import { useCallback, useState } from 'react'

export function useNearby() {
  const [nearby, setNearby] = useState<unknown[]>([])

  const refresh = useCallback(async () => {
    setNearby([])
  }, [])

  return { nearby, refresh }
}

export function useGeofence() {
  return { enabled: false }
}
