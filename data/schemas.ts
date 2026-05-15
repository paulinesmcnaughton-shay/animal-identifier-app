/**
 * Zod (or similar) schemas for API payloads — add when backend contracts are fixed.
 */
export interface SpeciesDto {
  id: string
  commonName: string
  scientificName?: string
}
