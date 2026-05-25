export type DayPeriodGreeting = 'Good morning' | 'Good afternoon' | 'Good evening'

/**
 * Common app greeting windows (local solar day):
 * - Morning: 5:00–11:59
 * - Afternoon: 12:00–16:59
 * - Evening: 17:00–4:59 (late night counts as evening until morning)
 */
export function greetingForHour(hour: number): DayPeriodGreeting {
  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function hourInTimeZone(timeZone: string, date = new Date()): number {
  try {
    const formatted = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      hour12: false,
    }).format(date)
    const hour = parseInt(formatted, 10)
    return Number.isFinite(hour) ? hour : date.getHours()
  } catch {
    return date.getHours()
  }
}

export function greetingForTimeZone(timeZone: string, date = new Date()): DayPeriodGreeting {
  return greetingForHour(hourInTimeZone(timeZone, date))
}

export function deviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return tz && tz.length > 0 ? tz : 'UTC'
  } catch {
    return 'UTC'
  }
}

/** Profile timezone from onboarding, else device (e.g. traveler at saved location). */
export function resolveGreetingTimeZone(profileTimeZone: string | null | undefined): string {
  const trimmed = profileTimeZone?.trim()
  if (trimmed) return trimmed
  return deviceTimeZone()
}
