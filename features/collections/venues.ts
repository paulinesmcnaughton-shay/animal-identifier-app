import { getSupabaseClient } from '@/lib/supabase/client'

// Future partnership layer: a zoo/aquarium/museum/farm/safari/petting-zoo with its
// own map, animal roster, and venue-specific photos. Tables exist and are read-ready;
// partner data is populated server-side (service role) as partnerships come online.

export type VenueType = 'zoo' | 'aquarium' | 'museum' | 'farm' | 'safari' | 'petting_zoo'

export interface Venue {
  id: string
  name: string
  type: VenueType
  description: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  mapImageUrl: string | null
  heroImageUrl: string | null
  website: string | null
  isPartner: boolean
}

export interface VenueAnimal {
  id: string
  venueId: string
  speciesId: string | null
  commonName: string | null
  scientificName: string | null
  kingdom: string | null
  dexNumber: string | null
  zone: string | null
  enclosure: string | null
  imageUrl: string | null
  notes: string | null
  displayOrder: number
}

interface VenueRow {
  id: string
  name: string
  type: VenueType
  description: string | null
  region: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  map_image_url: string | null
  hero_image_url: string | null
  website: string | null
  is_partner: boolean
}

interface VenueSpeciesRow {
  id: string
  venue_id: string
  species_id: string | null
  common_name: string | null
  zone: string | null
  enclosure: string | null
  image_url: string | null
  notes: string | null
  display_order: number
  catalog_species: {
    common_name: string | null
    scientific_name: string | null
    kingdom: string | null
    dex_number: string | null
  } | null
}

const VENUE_SELECT =
  'id, name, type, description, region, country, latitude, longitude, map_image_url, hero_image_url, website, is_partner'

function mapVenue(r: VenueRow): Venue {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    description: r.description,
    region: r.region,
    country: r.country,
    latitude: r.latitude,
    longitude: r.longitude,
    mapImageUrl: r.map_image_url,
    heroImageUrl: r.hero_image_url,
    website: r.website,
    isPartner: r.is_partner,
  }
}

export async function fetchVenue(id: string): Promise<Venue | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.from('venues').select(VENUE_SELECT).eq('id', id).maybeSingle()
  if (error || !data) return null
  return mapVenue(data as VenueRow)
}

export async function fetchVenues(type?: VenueType): Promise<Venue[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  let query = supabase.from('venues').select(VENUE_SELECT).order('name')
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error || !data) return []
  return (data as VenueRow[]).map(mapVenue)
}

export async function fetchVenueAnimals(venueId: string): Promise<VenueAnimal[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []
  const { data, error } = await supabase
    .from('venue_species')
    .select(
      'id, venue_id, species_id, common_name, zone, enclosure, image_url, notes, display_order, catalog_species(common_name, scientific_name, kingdom, dex_number)',
    )
    .eq('venue_id', venueId)
    .order('display_order')
  if (error || !data) return []
  return (data as unknown as VenueSpeciesRow[]).map((r) => ({
    id: r.id,
    venueId: r.venue_id,
    speciesId: r.species_id,
    commonName: r.catalog_species?.common_name ?? r.common_name,
    scientificName: r.catalog_species?.scientific_name ?? null,
    kingdom: r.catalog_species?.kingdom ?? null,
    dexNumber: r.catalog_species?.dex_number ?? null,
    zone: r.zone,
    enclosure: r.enclosure,
    imageUrl: r.image_url,
    notes: r.notes,
    displayOrder: r.display_order,
  }))
}
