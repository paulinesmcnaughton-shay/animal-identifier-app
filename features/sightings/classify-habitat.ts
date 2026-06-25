import Constants from 'expo-constants'

import { getSupabaseClient } from '@/lib/supabase/client'

// Habitat tag → keywords that appear in reverse-geocoded place names / POI categories.
const HABITAT_KEYWORDS: Record<string, string[]> = {
  beach: ['beach', 'seashore', 'shore', 'coast'],
  park: ['park'],
  forest: ['forest', 'woods', 'woodland', ' wood'],
  lake: ['lake', 'pond', 'reservoir'],
  river: ['river', 'creek', 'stream', 'bayou'],
  mountain: ['mountain', 'mount ', 'mt ', 'peak', 'summit', 'ridge'],
  zoo: ['zoo', 'aquarium', 'safari park', 'wildlife park'],
  farm: ['farm', 'ranch', 'orchard', 'pasture'],
  trail: ['trail', 'greenway'],
}

function mapboxToken(): string {
  const extra = Constants.expoConfig?.extra as { mapboxToken?: string } | undefined
  return extra?.mapboxToken ?? ''
}

function metersBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

interface GeoResult {
  country: string | null
  region: string | null
  blob: string
}

async function reverseGeocode(lat: number, lng: number, token: string): Promise<GeoResult | null> {
  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json` +
      `?access_token=${token}&types=poi,place,locality,neighborhood,region,country&limit=10`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = (await res.json()) as { features?: GeoFeature[] }
    let country: string | null = null
    let region: string | null = null
    const parts: string[] = []
    for (const f of data.features ?? []) {
      const ft = (f.place_type ?? [])[0]
      if (ft === 'country' && !country) country = f.text ?? null
      if (ft === 'region' && !region) region = f.text ?? null
      if (f.text) parts.push(f.text.toLowerCase())
      const category = f.properties?.category
      if (category) parts.push(category.toLowerCase())
      for (const c of f.context ?? []) {
        if (c.text) parts.push(c.text.toLowerCase())
        if (c.id?.startsWith('country') && !country) country = c.text ?? null
        if (c.id?.startsWith('region') && !region) region = c.text ?? null
      }
    }
    return { country, region, blob: parts.join(' | ') }
  } catch {
    return null
  }
}

let homeCache: { lat: number; lng: number; geo: GeoResult | null } | null = null

export interface ClassifyHabitatArgs {
  sightingId: string
  latitude: number
  longitude: number
  homeLatitude: number | null
  homeLongitude: number | null
}

/**
 * Reverse-geocode a sighting's GPS into habitat tags (forest/beach/park/…, plus
 * out-of-state / international vs home and backyard if near home) and store them on
 * the row. Best-effort and fire-and-forget — failures leave habitats null.
 */
export async function storeHabitatsForSighting(args: ClassifyHabitatArgs): Promise<void> {
  const token = mapboxToken()
  const supabase = getSupabaseClient()
  if (!token || !supabase) return

  const habitats = new Set<string>()

  if (args.homeLatitude != null && args.homeLongitude != null) {
    const d = metersBetween(args.latitude, args.longitude, args.homeLatitude, args.homeLongitude)
    if (d <= 200) habitats.add('backyard')
  }

  const geo = await reverseGeocode(args.latitude, args.longitude, token)
  if (geo) {
    for (const [habitat, keywords] of Object.entries(HABITAT_KEYWORDS)) {
      if (keywords.some((k) => geo.blob.includes(k))) habitats.add(habitat)
    }

    if (args.homeLatitude != null && args.homeLongitude != null) {
      let homeGeo: GeoResult | null
      if (homeCache && homeCache.lat === args.homeLatitude && homeCache.lng === args.homeLongitude) {
        homeGeo = homeCache.geo
      } else {
        homeGeo = await reverseGeocode(args.homeLatitude, args.homeLongitude, token)
        homeCache = { lat: args.homeLatitude, lng: args.homeLongitude, geo: homeGeo }
      }
      if (homeGeo) {
        if (geo.country && homeGeo.country && geo.country !== homeGeo.country) {
          habitats.add('international')
        } else if (geo.region && homeGeo.region && geo.region !== homeGeo.region) {
          habitats.add('out-of-state')
        }
      }
    }
  }

  if (habitats.size === 0) return
  await supabase.from('user_sightings').update({ habitats: [...habitats] }).eq('id', args.sightingId)
}

interface GeoFeature {
  place_type?: string[]
  text?: string
  properties?: { category?: string }
  context?: { id?: string; text?: string }[]
}
