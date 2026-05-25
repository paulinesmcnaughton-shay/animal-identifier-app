const METERS_PER_MILE = 1609.344

/** Stepped radii — fetch at 5 mi first, expand only if nothing found. */
export const NEARBY_RADIUS_STEPS_MILES = [5, 10, 15, 20] as const

/** First step and sort priority boundary. */
export const NEARBY_PRIORITY_MILES = 5
export const NEARBY_PRIORITY_M = NEARBY_PRIORITY_MILES * METERS_PER_MILE
export const NEARBY_PRIORITY_KM = NEARBY_PRIORITY_MILES * 1.609344

/** Hard cap — never fetch beyond this. */
export const NEARBY_RADIUS_MILES = 20
export const NEARBY_RADIUS_M = NEARBY_RADIUS_MILES * METERS_PER_MILE
export const NEARBY_RADIUS_KM = NEARBY_RADIUS_MILES * 1.609344

export function isWithinNearbyRadius(distanceM: number): boolean {
  return distanceM >= 0 && distanceM <= NEARBY_RADIUS_M
}

export function isWithinPriorityRadius(distanceM: number): boolean {
  return distanceM >= 0 && distanceM <= NEARBY_PRIORITY_M
}

export function filterWithinNearbyRadius<T extends { distanceM: number }>(items: T[]): T[] {
  return items.filter((item) => isWithinNearbyRadius(item.distanceM))
}

/** Closest sightings first; everything within 5 mi before anything farther out. */
export function sortByDistancePriority<T extends { distanceM: number }>(items: T[]): T[] {
  const nearby = items
    .filter((item) => isWithinPriorityRadius(item.distanceM))
    .sort((a, b) => a.distanceM - b.distanceM)
  const farther = items
    .filter((item) => !isWithinPriorityRadius(item.distanceM) && isWithinNearbyRadius(item.distanceM))
    .sort((a, b) => a.distanceM - b.distanceM)
  return [...nearby, ...farther]
}

/** Refetch nearby species after moving this far (e.g. driving to a new area). */
export const NEARBY_RELOAD_MOVE_MILES = 2
export const NEARBY_RELOAD_MOVE_M = NEARBY_RELOAD_MOVE_MILES * METERS_PER_MILE
