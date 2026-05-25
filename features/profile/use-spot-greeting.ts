import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'

import {
  greetingForTimeZone,
  resolveGreetingTimeZone,
  type DayPeriodGreeting,
} from '@/features/profile/time-greeting'

export function useSpotGreeting(profileTimeZone: string | null | undefined): DayPeriodGreeting {
  const [greeting, setGreeting] = useState<DayPeriodGreeting>(() =>
    greetingForTimeZone(resolveGreetingTimeZone(profileTimeZone)),
  )

  const refresh = useCallback(() => {
    setGreeting(greetingForTimeZone(resolveGreetingTimeZone(profileTimeZone)))
  }, [profileTimeZone])

  useFocusEffect(
    useCallback(() => {
      refresh()
      const interval = setInterval(refresh, 60_000)
      return () => clearInterval(interval)
    }, [refresh]),
  )

  return greeting
}
