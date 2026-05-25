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

export interface CommunityNearbySighting extends MapSighting {
  distanceM: number
  /** Other explorers who reported this species at this spot. */
  explorerCount: number
}
