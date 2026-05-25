export const SIGHTING_MAP_PRIVACY = ['private', 'anonymous', 'public'] as const

export type SightingMapPrivacy = (typeof SIGHTING_MAP_PRIVACY)[number]

export function isVisibleOnNearbyMap(privacy: SightingMapPrivacy): boolean {
  return privacy === 'anonymous' || privacy === 'public'
}
