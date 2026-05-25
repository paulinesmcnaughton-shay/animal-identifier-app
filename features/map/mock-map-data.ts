import type { KingdomKey } from '@/design/atoms/KingdomBadge'

import type { MapSighting } from '@/features/map/map-sighting'

/** Logged-in user's own sightings (My Sightings tab). */
export const MOCK_MY_SIGHTINGS: MapSighting[] = [
  { id: 'mine-1', name: 'Red Fox', kingdom: 'mammal', lat: 51.5076, lng: -0.0962, date: 'Today', count: 1 },
  { id: 'mine-2', name: 'Monarch Butterfly', kingdom: 'insect', lat: 51.5043, lng: -0.0813, date: 'Yesterday', count: 1, isNew: true },
  { id: 'mine-3', name: 'Common Frog', kingdom: 'amphibian', lat: 51.5011, lng: -0.0880, date: '2d ago', count: 1 },
]

/** Other explorers near the map demo anchor (Nearby tab). */
export const MOCK_COMMUNITY_NEARBY: MapSighting[] = [
  { id: 'comm-1', name: 'Red Fox', kingdom: 'mammal', lat: 51.5076, lng: -0.0962, date: 'Today', count: 3 },
  { id: 'comm-2', name: 'European Robin', kingdom: 'bird', lat: 51.5084, lng: -0.0850, date: 'Yesterday', count: 5 },
  { id: 'comm-3', name: 'Monarch Butterfly', kingdom: 'insect', lat: 51.5043, lng: -0.0813, date: '3d ago', count: 2, isNew: true },
  { id: 'comm-4', name: 'European Badger', kingdom: 'mammal', lat: 51.5019, lng: -0.0948, date: '1w ago', count: 4 },
  { id: 'comm-5', name: 'Blue Jay', kingdom: 'bird', lat: 51.5028, lng: -0.0854, date: '2w ago', count: 1 },
  { id: 'comm-6', name: 'Brown Hare', kingdom: 'mammal', lat: 51.5091, lng: -0.0905, date: 'Today', count: 2 },
  { id: 'comm-7', name: 'Palmate Newt', kingdom: 'amphibian', lat: 51.5058, lng: -0.0985, date: '4d ago', count: 6, isNew: true },
  { id: 'comm-8', name: 'Tawny Owl', kingdom: 'bird', lat: 51.5034, lng: -0.0973, date: '1w ago', count: 3 },
]

const KINGDOM_KEYS: KingdomKey[] = [
  'mammal',
  'bird',
  'reptile',
  'amphibian',
  'fish',
  'insect',
  'arachnid',
  'mollusc',
]

export function parseKingdom(value: string | null): KingdomKey {
  if (value && KINGDOM_KEYS.includes(value as KingdomKey)) {
    return value as KingdomKey
  }
  return 'mammal'
}
