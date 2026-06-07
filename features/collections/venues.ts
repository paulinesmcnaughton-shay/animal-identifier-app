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
    .select('id, venue_id, species_id, common_name, zone, enclosure, image_url, notes, display_order')
    .eq('venue_id', venueId)
    .order('display_order')
  if (error || !data) return []
  return (data as VenueSpeciesRow[]).map((r) => ({
    id: r.id,
    venueId: r.venue_id,
    speciesId: r.species_id,
    commonName: r.common_name,
    zone: r.zone,
    enclosure: r.enclosure,
    imageUrl: r.image_url,
    notes: r.notes,
    displayOrder: r.display_order,
  }))
}
