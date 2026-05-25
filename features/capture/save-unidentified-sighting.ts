import * as Location from 'expo-location'

import { storage } from '@/util/storage'

const STORAGE_KEY = 'wildkind_unidentified_sightings'

async function getJson<T>(key: string): Promise<T | null> {
  const raw = await storage.getString(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

async function setJson<T>(key: string, value: T): Promise<void> {
  await storage.set(key, JSON.stringify(value))
}

export interface UnidentifiedSighting {
  id: string
  photoUri: string
  latitude: number
  longitude: number
  spottedAt: string
}

export async function saveUnidentifiedSighting(photoUri: string): Promise<UnidentifiedSighting> {
  let latitude = 0
  let longitude = 0

  try {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status === 'granted') {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      latitude = position.coords.latitude
      longitude = position.coords.longitude
    }
  } catch {
    // Location optional — still save sighting
  }

  const entry: UnidentifiedSighting = {
    id: `unidentified-${Date.now()}`,
    photoUri,
    latitude,
    longitude,
    spottedAt: new Date().toISOString(),
  }

  const existing = (await getJson<UnidentifiedSighting[]>(STORAGE_KEY)) ?? []
  await setJson(STORAGE_KEY, [entry, ...existing])

  return entry
}
