import type { DexCardSpecies } from '@/components/DexCard'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { formatSpottedAgo } from '@/features/map/geo'
import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { filterWithinNearbyRadius } from '@/features/map/nearby-radius'
import { userSightingToNearbyMapPin } from '@/features/map/map-sighting-adapters'
import type { MapCoordinate } from '@/features/map/use-user-location'
import { parseKingdom } from '@/features/map/mock-map-data'
import { getDexNumberForSpeciesId } from '@/features/species/dex-number-registry'
import { getSupabaseClient } from '@/lib/supabase/client'

const GRADIENT_BY_KINGDOM: Record<KingdomKey, readonly [string, string]> = {
  mammal: ['#FFB088', '#FF6B5B'],
  bird: ['#FF8A80', '#E04A39'],
  reptile: ['#A4DE3A', '#0E8F65'],
  amphibian: ['#98E2C6', '#3DCCA8'],
  fish: ['#B388FF', '#7C3AED'],
  insect: ['#FFC93C', '#E8A020'],
  arachnid: ['#C4B5FD', '#4338CA'],
  mollusc: ['#FCE7C7', '#B45309'],
  plant:  ['#A4DE3A', '#65A30D'],
  tree:   ['#52B788', '#2D6A4F'],
  flower: ['#F9A8D4', '#E879A0'],
}

export interface UserSightingRow {
  id: string
  species_id: string
  species_name: string
  kingdom: string
  latin_name: string | null
  dex_number: string | null
  confidence: number | null
  is_domestic: boolean
  photo_uri: string | null
  latitude: number | null
  longitude: number | null
  spotted_at: string
  is_pinned: boolean
  notes: string | null
  journal_entry: string | null
  user_caption: string | null
  is_favorite: boolean
  is_deleted: boolean
  deleted_at: string | null
}

function rowToDexCard(latest: UserSightingRow): DexCardSpecies {
  const kingdom = parseKingdom(latest.kingdom)
  const number =
    latest.dex_number?.trim() || getDexNumberForSpeciesId(latest.species_id) || '#???'

  return {
    id: latest.species_id,
    number,
    name: latest.species_name,
    date: formatSpottedAgo(latest.spotted_at),
    kingdom,
    gradient: GRADIENT_BY_KINGDOM[kingdom],
  }
}

/** Latest sighting per species for Wild Dex grid (newest first). */
export function buildDexEntriesFromSightings(rows: UserSightingRow[]): DexCardSpecies[] {
  const bySpecies = new Map<string, UserSightingRow>()

  for (const row of rows) {
    const existing = bySpecies.get(row.species_id)
    if (!existing || new Date(row.spotted_at) > new Date(existing.spotted_at)) {
      bySpecies.set(row.species_id, row)
    }
  }

  return [...bySpecies.values()]
    .sort((a, b) => new Date(b.spotted_at).getTime() - new Date(a.spotted_at).getTime())
    .map((latest) => rowToDexCard(latest))
}

export async function fetchUserSightings(): Promise<UserSightingRow[] | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return null

  const { data, error } = await supabase
    .from('user_sightings')
    .select(
      'id, species_id, species_name, kingdom, latin_name, dex_number, confidence, is_domestic, photo_uri, latitude, longitude, spotted_at, is_pinned, notes, journal_entry, user_caption, is_favorite, is_deleted, deleted_at',
    )
    .eq('user_id', userId)
    .eq('is_deleted', false)
    .order('spotted_at', { ascending: false })

  if (error) {
    if (__DEV__) console.warn('[WildKind] user_sightings fetch failed:', error.message)
    return null
  }

  return (data ?? []) as UserSightingRow[]
}

export async function fetchUserMapSightings(
  userCoord: MapCoordinate,
): Promise<NearbyMapSighting[]> {
  const rows = await fetchUserSightings()
  if (!rows) return []

  return filterWithinNearbyRadius(
    rows
      .map((row) => userSightingToNearbyMapPin(row, userCoord))
      .filter((item): item is NearbyMapSighting => item !== null),
  )
}

export async function fetchRecentDexCards(limit = 8): Promise<DexCardSpecies[]> {
  const rows = await fetchUserSightings()
  if (!rows) return []
  return buildDexEntriesFromSightings(rows).slice(0, limit)
}
