/**
 * Returns the best reference image URI for a species.
 * Use for: Dex cards, Species Detail hero, map mini cards, identify results, search results.
 * Do NOT use for user sighting thumbnails — use getSightingPhotoUri for those.
 */
export function getSpeciesReferenceImageUri(species?: {
  image_url?: string | null
  reference_image_url?: string | null
  wikipedia_image_url?: string | null
  inat_image_url?: string | null
  google_image_url?: string | null
  openai_image_url?: string | null
  claude_image_url?: string | null
  default_image_url?: string | null
} | null): string | null {
  if (!species) return null
  return (
    species.image_url?.trim() ||
    species.reference_image_url?.trim() ||
    species.wikipedia_image_url?.trim() ||
    species.inat_image_url?.trim() ||
    species.google_image_url?.trim() ||
    species.openai_image_url?.trim() ||
    species.claude_image_url?.trim() ||
    species.default_image_url?.trim() ||
    null
  )
}

/**
 * Returns the user's sighting photo URI.
 * Use ONLY for Sightings rows and My Sightings list.
 * Do NOT use for species cards, hero images, or map cards.
 */
export function getSightingPhotoUri(sighting?: {
  photo_uri?: string | null
  photo_url?: string | null
  image_uri?: string | null
  local_uri?: string | null
  photoUri?: string | null
} | null): string | null {
  if (!sighting) return null
  return (
    sighting.photo_uri?.trim() ||
    sighting.photo_url?.trim() ||
    sighting.image_uri?.trim() ||
    sighting.local_uri?.trim() ||
    sighting.photoUri?.trim() ||
    null
  )
}
