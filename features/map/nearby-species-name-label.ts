/** Max visible length for species names in the Nearby sheet (spaces count). */
export const NEARBY_SPECIES_NAME_MAX_LENGTH = 30

export function truncateNearbySpeciesName(
  name: string,
  maxLength = NEARBY_SPECIES_NAME_MAX_LENGTH,
): string {
  const trimmed = name.trim()
  if (trimmed.length <= maxLength) return trimmed
  return `${trimmed.slice(0, maxLength)}…`
}

export function isNearbySpeciesNameTruncated(
  name: string,
  maxLength = NEARBY_SPECIES_NAME_MAX_LENGTH,
): boolean {
  return name.trim().length > maxLength
}
