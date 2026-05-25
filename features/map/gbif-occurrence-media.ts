const GBIF_MULTIMEDIA = 'http://rs.gbif.org/terms/1.0/Multimedia'
const DC_IDENTIFIER = 'http://purl.org/dc/terms/identifier'
const DC_TYPE = 'http://purl.org/dc/terms/type'

const GBIF_SPECIES_MEDIA = 'https://api.gbif.org/v1/species'

interface GbifMultimediaRow {
  [key: string]: string | undefined
}

export interface GbifOccurrenceMediaFields {
  extensions?: Record<string, GbifMultimediaRow[] | undefined>
}

function readIdentifier(row: GbifMultimediaRow): string | null {
  const raw = row[DC_IDENTIFIER] ?? row.identifier
  if (!raw?.trim()) return null
  const url = raw.trim()
  return url.startsWith('http') ? url : null
}

function isStillImage(row: GbifMultimediaRow): boolean {
  const type = (row[DC_TYPE] ?? row.type ?? '').toLowerCase()
  return !type || type.includes('image') || type === 'stillimage'
}

/** Extract a CC-licensed photo URL bundled on a GBIF occurrence record. */
export function imageUrlFromGbifOccurrence(row: GbifOccurrenceMediaFields): string | null {
  const rows = row.extensions?.[GBIF_MULTIMEDIA]
  if (!rows?.length) return null

  for (const media of rows) {
    if (!isStillImage(media)) continue
    const url = readIdentifier(media)
    if (url) return url
  }

  return null
}

interface GbifSpeciesMediaResponse {
  results?: { identifier?: string; type?: string }[]
}

export async function fetchGbifTaxonImageUrl(taxonKey: number): Promise<string | null> {
  try {
    const response = await fetch(`${GBIF_SPECIES_MEDIA}/${taxonKey}/media?limit=8`)
    if (!response.ok) return null

    const payload = (await response.json()) as GbifSpeciesMediaResponse
    for (const item of payload.results ?? []) {
      const url = item.identifier?.trim()
      if (!url?.startsWith('http')) continue
      const type = (item.type ?? '').toLowerCase()
      if (!type || type.includes('image')) return url
    }
  } catch {
    return null
  }

  return null
}

export async function resolveGbifHeroImageUrl(input: {
  previewImageUrl?: string | null
  taxonKey?: number | null
}): Promise<string | null> {
  const preview = input.previewImageUrl?.trim()
  if (preview) return preview

  if (input.taxonKey != null && Number.isFinite(input.taxonKey)) {
    return fetchGbifTaxonImageUrl(input.taxonKey)
  }

  return null
}
