import type { KingdomKey } from '@/design/atoms/KingdomBadge'

export interface MapSighting {
  id: string
  name: string
  kingdom: KingdomKey
  lat: number
  lng: number
  date: string
  count: number
  isNew?: boolean
}

export type NearbySightingSource = 'gbif' | 'community' | 'user' | 'ai'

export interface NearbyMapSighting extends MapSighting {
  distanceM: number
  source: NearbySightingSource
  /** Catalog / community id for field guide + hero lookup */
  speciesId?: string | null
  /** WildKind: reports at this pin. GBIF: always 1 (verified record). */
  explorerCount: number
  isVerified: boolean
  /** Public community only — explorer @handle */
  spottedByUsername?: string | null
  /** GBIF occurrence photo when available (StillImage media on the record). */
  previewImageUrl?: string | null
  /** GBIF taxonomy — improves image + field-guide lookup. */
  scientificName?: string | null
  gbifTaxonKey?: number | null
  gbifOccurrenceKey?: number | null
}

/** @deprecated Use NearbyMapSighting */
export type CommunityNearbySighting = NearbyMapSighting
