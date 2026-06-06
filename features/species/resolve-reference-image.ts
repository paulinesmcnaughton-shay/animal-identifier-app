import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { resolvePhoto } from '@/features/species/use-taxa-photo'

export type ReferenceImageSource =
  | 'app_registry'
  | 'domestic_registry'
  | 'inaturalist'
  | 'wikipedia'
  | 'ai_metadata'
  | 'category_placeholder'
  | 'needs_id_placeholder'

export interface ResolvedImage {
  uri: string
  source: ReferenceImageSource
  confidence: number
  reason: string
}

export interface ReferenceImageInput {
  commonName: string
  scientificName?: string | null
  speciesId?: string | null
  dexNum?: string | null
  taxonId?: number | null
  kingdom?: KingdomKey | null
  isDomestic?: boolean
  /** From species table (image_url, reference_image_url, hero_image_url, etc.) */
  appRegistryImageUrl?: string | null
  /** From domestic_species.reference_image_url — only used when isDomestic is true */
  domesticRegistryImageUrl?: string | null
  /** URL provided by the AI identification pipeline (claude_image_url, openai_image_url) */
  aiImageUrl?: string | null
}

function firstNonEmpty(...urls: (string | null | undefined)[]): string | null {
  for (const url of urls) {
    const trimmed = url?.trim()
    if (trimmed) return trimmed
  }
  return null
}

/**
 * Resolves the best available reference image for any species or organism.
 *
 * Priority:
 *   1. App registry fields (species table image columns)
 *   2. Domestic registry image — only when isDomestic is true
 *   3. AI-provided metadata URL
 *   4. External lookup: iNat → Wikipedia → Wikimedia (kingdom-validated)
 *   5. null — let the UI show its category placeholder/gradient
 *
 * The kingdom is threaded through every external lookup to prevent
 * cross-category contamination (e.g. "Bengal" mammal never returns a frog photo).
 */
export async function resolveReferenceImage(
  input: ReferenceImageInput,
): Promise<ResolvedImage | null> {
  const {
    commonName,
    scientificName,
    speciesId,
    dexNum,
    kingdom,
    isDomestic,
    appRegistryImageUrl,
    domesticRegistryImageUrl,
    aiImageUrl,
  } = input

  let registryImage: string | null = null
  let domesticImage: string | null = null
  let inatImage: string | null = null
  let wikipediaImage: string | null = null
  let aiImage: string | null = null

  // 1. App registry
  const fromRegistry = firstNonEmpty(appRegistryImageUrl)
  if (fromRegistry) {
    registryImage = fromRegistry
    const result: ResolvedImage = { uri: fromRegistry, source: 'app_registry', confidence: 1, reason: 'app_registry' }
    logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result })
    return result
  }

  // 2. Domestic registry — strict: only use when species is confirmed domestic
  if (isDomestic) {
    const fromDomestic = firstNonEmpty(domesticRegistryImageUrl)
    if (fromDomestic) {
      domesticImage = fromDomestic
      const result: ResolvedImage = { uri: fromDomestic, source: 'domestic_registry', confidence: 0.95, reason: 'domestic_registry' }
      logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result })
      return result
    }
  }

  // 3. AI metadata URL (from identify pipeline)
  const fromAi = firstNonEmpty(aiImageUrl)
  if (fromAi) {
    aiImage = fromAi
    const result: ResolvedImage = { uri: fromAi, source: 'ai_metadata', confidence: 0.8, reason: 'ai_metadata' }
    logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result })
    return result
  }

  // 4. External lookup via iNat + Wikipedia (kingdom-validated)
  const query = commonName?.trim() ?? ''
  const latin = scientificName?.trim() ?? ''

  // Run iNat and Wikipedia in parallel for speed
  const [inatResult, wikiResult] = await Promise.all([
    query || latin
      ? resolvePhoto(query, latin, kingdom).catch(() => null)
      : Promise.resolve(null),
    query
      ? fetchWikipediaOnly(query).catch(() => null)
      : Promise.resolve(null),
  ])

  inatImage = inatResult
  wikipediaImage = wikiResult

  // Prefer iNat (has species-specific photos); Wikipedia as fallback
  const external = inatImage ?? wikipediaImage ?? null

  if (external) {
    const source: ReferenceImageSource = inatImage ? 'inaturalist' : 'wikipedia'
    const result: ResolvedImage = { uri: external, source, confidence: 0.7, reason: source }
    logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result })
    return result
  }

  // 5. No image found — caller renders category placeholder
  logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result: null })
  return null
}

async function fetchWikipediaOnly(query: string): Promise<string | null> {
  const title = query.trim().replace(/ /g, '_')
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`,
      { headers: { Accept: 'application/json' } },
    )
    if (res.ok) {
      const d = (await res.json()) as { thumbnail?: { source?: string } }
      const thumb = d.thumbnail?.source
      if (thumb) return thumb.replace(/\/\d+px-/, '/800px-')
    }
  } catch {}
  return null
}

interface LogFields {
  registryImage: string | null
  domesticImage: string | null
  inatImage: string | null
  wikipediaImage: string | null
  aiImage: string | null
  result: ResolvedImage | null
}

function logResolved(input: ReferenceImageInput, fields: LogFields): void {
  if (!__DEV__) return
  console.log('REFERENCE IMAGE RESOLVED', {
    commonName: input.commonName,
    scientificName: input.scientificName ?? null,
    speciesId: input.speciesId ?? null,
    dexNum: input.dexNum ?? null,
    taxonId: input.taxonId ?? null,
    kingdom: input.kingdom ?? null,
    category: input.isDomestic ? 'domestic' : (input.kingdom ?? 'unknown'),
    registryImage: fields.registryImage,
    domesticImage: fields.domesticImage,
    inatImage: fields.inatImage,
    wikipediaImage: fields.wikipediaImage,
    googleImage: null,
    aiImage: fields.aiImage,
    finalUri: fields.result?.uri ?? null,
    source: fields.result?.source ?? 'needs_id_placeholder',
    reason: fields.result?.reason ?? 'no_image_found',
  })
}
