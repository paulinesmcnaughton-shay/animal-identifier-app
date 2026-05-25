import { slugifySpeciesName } from '@/data/species-catalog'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { kingdomFromGbifTaxonomy } from '@/features/map/gbif-kingdom'
import { imageUrlFromGbifOccurrence } from '@/features/map/gbif-occurrence-media'
import { boundingBox, formatSpottedAgo, haversineDistanceM } from '@/features/map/geo'
import type { MapCoordinate } from '@/features/map/use-user-location'

import { NEARBY_RADIUS_KM } from '@/features/map/nearby-radius'

const GBIF_OCCURRENCE_SEARCH = 'https://api.gbif.org/v1/occurrence/search'
const GBIF_LIMIT = 32

interface GbifOccurrenceResult {
  key: number
  taxonKey?: number
  scientificName?: string
  vernacularName?: string
  decimalLatitude?: number
  decimalLongitude?: number
  eventDate?: string
  class?: string
  order?: string
  phylum?: string
  extensions?: Record<string, Record<string, string | undefined>[]>
}

interface GbifSearchResponse {
  results?: GbifOccurrenceResult[]
}

function displayNameFromGbif(row: GbifOccurrenceResult): string {
  const common = row.vernacularName?.trim()
  if (common) return common

  const scientific = row.scientificName?.trim()
  if (!scientific) return 'Unknown species'

  const genusSpecies = scientific.split(',')[0]?.trim()
  return genusSpecies || scientific
}

function parseGbifEventDate(eventDate?: string): string {
  if (!eventDate?.trim()) return 'Recorded nearby'
  const iso = eventDate.length === 4 ? `${eventDate}-06-01` : eventDate
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return 'Recorded nearby'
  return formatSpottedAgo(parsed.toISOString())
}

function occurrenceToSighting(
  row: GbifOccurrenceResult,
  userCoord: MapCoordinate,
  maxRadiusKm: number,
): NearbyMapSighting | null {
  const lat = row.decimalLatitude
  const lng = row.decimalLongitude
  if (lat == null || lng == null || !Number.isFinite(lat) || !Number.isFinite(lng)) return null

  const distanceM = haversineDistanceM(userCoord, { lat, lng })
  if (distanceM > maxRadiusKm * 1000) return null

  const name = displayNameFromGbif(row)
  const scientificName = row.scientificName?.trim() || null
  const previewImageUrl = imageUrlFromGbifOccurrence(row)

  return {
    id: `gbif-${row.key}`,
    name,
    speciesId: slugifySpeciesName(name),
    kingdom: kingdomFromGbifTaxonomy(row),
    lat,
    lng,
    date: parseGbifEventDate(row.eventDate),
    count: 1,
    distanceM,
    source: 'gbif',
    explorerCount: 1,
    isVerified: true,
    spottedByUsername: null,
    previewImageUrl,
    scientificName,
    gbifTaxonKey: row.taxonKey ?? null,
    gbifOccurrenceKey: row.key,
  }
}

export interface FetchGbifNearbyOptions {
  stillImageOnly?: boolean
}

/** Layer 1 — GBIF verified occurrence records near the user (always attempted). */
export async function fetchGbifNearbySightings(
  userCoord: MapCoordinate,
  options: FetchGbifNearbyOptions = {},
  radiusKm = NEARBY_RADIUS_KM,
): Promise<NearbyMapSighting[]> {
  const stillImageOnly = options.stillImageOnly !== false
  const box = boundingBox(userCoord, radiusKm)
  const params = new URLSearchParams({
    decimalLatitude: `${box.minLat},${box.maxLat}`,
    decimalLongitude: `${box.minLng},${box.maxLng}`,
    kingdomKey: '1',
    hasCoordinate: 'true',
    hasGeospatialIssue: 'false',
    limit: String(GBIF_LIMIT),
  })
  if (stillImageOnly) {
    params.set('mediaType', 'StillImage')
  }

  try {
    const response = await fetch(`${GBIF_OCCURRENCE_SEARCH}?${params.toString()}`)
    if (!response.ok) {
      if (__DEV__) console.warn('[WildKind] GBIF fetch failed:', response.status)
      return []
    }

    const payload = (await response.json()) as GbifSearchResponse
    const rows = payload.results ?? []

    const sightings: NearbyMapSighting[] = []
    const seen = new Set<string>()

    for (const row of rows) {
      const item = occurrenceToSighting(row, userCoord, radiusKm)
      if (!item) continue

      const dedupeKey = `${item.name.toLowerCase()}|${item.lat.toFixed(3)}|${item.lng.toFixed(3)}`
      if (seen.has(dedupeKey)) continue
      seen.add(dedupeKey)

      sightings.push(item)
    }

    return sightings.sort((a, b) => a.distanceM - b.distanceM)
  } catch (error) {
    if (__DEV__) console.warn('[WildKind] GBIF fetch error:', error)
    return []
  }
}
