import * as Location from 'expo-location'
import { useEffect, useState } from 'react'

interface DeviceHeadingState {
  /** Degrees clockwise from true north (0–360). Null when unavailable. */
  heading: number | null
  isAvailable: boolean
}

function readHeading(heading: Location.LocationHeadingObject): number | null {
  const value = heading.trueHeading >= 0 ? heading.trueHeading : heading.magHeading
  if (!Number.isFinite(value) || value < 0) return null
  return value % 360
}

export function useDeviceHeading(): DeviceHeadingState {
  const [heading, setHeading] = useState<number | null>(null)
  const [isAvailable, setIsAvailable] = useState(false)

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null
    let cancelled = false

    void (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted' || cancelled) return

      const canWatch = await Location.hasServicesEnabledAsync()
      if (!canWatch || cancelled) return

      subscription = await Location.watchHeadingAsync((update) => {
        const next = readHeading(update)
        setHeading(next)
        setIsAvailable(next !== null)
      })
    })()

    return () => {
      cancelled = true
      subscription?.remove()
    }
  }, [])

  return { heading, isAvailable }
}
