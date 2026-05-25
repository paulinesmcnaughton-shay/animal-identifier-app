import {
  NEARBY_PRIORITY_KM,
  NEARBY_PRIORITY_MILES,
  NEARBY_RADIUS_KM,
  NEARBY_RADIUS_MILES,
} from '@/features/map/nearby-radius'
import { storage } from '@/util/storage'

export type DistanceUnit = 'miles' | 'km'

const STORAGE_KEY = 'settings.distanceUnit'

const METERS_PER_MILE = 1609.344
const METERS_PER_FOOT = 0.3048

/** @deprecated Use NEARBY_RADIUS_MILES from @/features/map/nearby-radius */
export const NEARBY_FALLBACK_RADIUS_MILES = NEARBY_RADIUS_MILES

/** @deprecated Use NEARBY_RADIUS_KM from @/features/map/nearby-radius */
export const NEARBY_FALLBACK_RADIUS_KM = NEARBY_RADIUS_KM

export const DISTANCE_UNIT_OPTIONS: {
  value: DistanceUnit
  label: string
  subtitle: string
}[] = [
  { value: 'miles', label: 'Miles', subtitle: 'Feet and miles — WildKind default' },
  { value: 'km', label: 'Kilometers', subtitle: 'Meters and kilometers' },
]

/** US and other countries that commonly use miles on device locale. */
export function detectDistanceUnitFromDevice(): DistanceUnit {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale.replace('_', '-')
    const region = locale.split('-').pop()?.toUpperCase()
    if (region === 'US') return 'miles'
  } catch {
    // fall through
  }
  return 'miles'
}

function normalizeStoredUnit(raw: string | null): DistanceUnit | null {
  if (raw === 'miles' || raw === 'km') return raw
  return null
}

export async function ensureDistanceUnitInitialized(): Promise<DistanceUnit> {
  const existing = normalizeStoredUnit(await storage.getString(STORAGE_KEY))
  if (existing) return existing

  const detected = detectDistanceUnitFromDevice()
  await storage.set(STORAGE_KEY, detected)
  return detected
}

export async function loadDistanceUnit(): Promise<DistanceUnit> {
  return ensureDistanceUnitInitialized()
}

export async function saveDistanceUnit(unit: DistanceUnit): Promise<void> {
  await storage.set(STORAGE_KEY, unit)
}

export function distanceUnitLabel(unit: DistanceUnit): string {
  return DISTANCE_UNIT_OPTIONS.find((o) => o.value === unit)?.label ?? 'Miles'
}

export function formatDistance(meters: number, unit: DistanceUnit): string {
  if (unit === 'miles') {
    const miles = meters / METERS_PER_MILE
    if (miles < 0.1) {
      const feet = Math.round(meters / METERS_PER_FOOT)
      return `${feet} ft away`
    }
    if (miles < 10) return `${miles.toFixed(1)} mi away`
    return `${Math.round(miles)} mi away`
  }

  if (meters < 1000) return `${Math.round(meters)} m away`
  return `${(meters / 1000).toFixed(1)} km away`
}

export function nearbySearchEmptyMessage(unit: DistanceUnit): string {
  if (unit === 'miles') {
    return `No sightings within ${NEARBY_PRIORITY_MILES} miles yet. We also checked up to ${NEARBY_RADIUS_MILES} miles.`
  }
  return `No sightings within ${Math.round(NEARBY_PRIORITY_KM)} km yet. We also checked up to ${Math.round(NEARBY_RADIUS_KM)} km.`
}
