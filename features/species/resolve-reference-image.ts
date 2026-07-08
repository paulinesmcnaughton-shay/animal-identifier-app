import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { buildPhotoCacheKey, peekPhotoSource, resolvePhoto } from '@/features/species/use-taxa-photo'

export type ReferenceImageSource =
  | 'database'
  | 'domestic_registry'
  | 'farm_registry'
  | 'zoo_registry'
  | 'aquarium_registry'
  | 'inaturalist'
  | 'wikipedia'
  | 'wikimedia'
  | 'user_submitted'
  | 'google'
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

/** Category label used in both the debug log and the cache identity. */
export function referenceCategory(input: ReferenceImageInput): string {
  return input.isDomestic ? 'domestic' : (input.kingdom ?? 'unknown')
}

/**
 * Identity segment of the external cache key. Includes species_id, dex_num,
 * taxon_id and category so two different species that share a common name never
 * collide — while the same species reuses one cache entry across screens.
 */
export function buildResolverIdentity(input: ReferenceImageInput): string {
  return [
    input.speciesId ?? '',
    input.dexNum ?? '',
    input.taxonId ?? '',
    referenceCategory(input),
  ].join('~')
}

/**
 * Synchronous part of the reference-image priority — the part that needs no
 * network call. Single source of truth for the registry → domestic → AI order,
 * shared by both `resolveReferenceImage` (async) and `useReferenceImage` (hook).
 *
 *   1. App registry fields (species table image columns)
 *   2. Domestic registry image — STRICT: only when isDomestic is true
 *   3. AI-provided metadata URL
 *
 * Returns null when none of the pre-resolved sources have a URL, meaning the
 * caller must fall through to the external (iNat/Wikipedia) lookup.
 */
export function pickPreResolvedImage(input: ReferenceImageInput): ResolvedImage | null {
  const fromRegistry = firstNonEmpty(input.appRegistryImageUrl)
  if (fromRegistry) {
    return { uri: fromRegistry, source: 'database', confidence: 1, reason: 'database' }
  }

  // Domestic registry images apply ONLY to confirmed domestic pets — this is the
  // gate that stops a dog/cat image ever attaching to a frog/plant/insect/bird.
  if (input.isDomestic) {
    const fromDomestic = firstNonEmpty(input.domesticRegistryImageUrl)
    if (fromDomestic) {
      return { uri: fromDomestic, source: 'domestic_registry', confidence: 0.95, reason: 'domestic_registry' }
    }
  }

  const fromAi = firstNonEmpty(input.aiImageUrl)
  if (fromAi) {
    return { uri: fromAi, source: 'ai_metadata', confidence: 0.8, reason: 'ai_metadata' }
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
  const { commonName, scientificName, kingdom } = input

  let registryImage: string | null = null
  let domesticImage: string | null = null
  let inatImage: string | null = null
  let wikipediaImage: string | null = null
  let aiImage: string | null = null

  // 1-3. Pre-resolved sources (registry → domestic → AI), shared with the hook.
  const preResolved = pickPreResolvedImage(input)
  if (preResolved) {
    if (preResolved.source === 'database') registryImage = preResolved.uri
    else if (preResolved.source === 'domestic_registry') domesticImage = preResolved.uri
    else if (preResolved.source === 'ai_metadata') aiImage = preResolved.uri
    logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result: preResolved })
    return preResolved
  }

  // 4. External lookup — Wikipedia → Wikimedia Commons only (commercial-safe CC),
  // via resolvePhoto. No iNaturalist or Google image sources.
  const query = commonName?.trim() ?? ''
  const latin = scientificName?.trim() ?? ''
  const identity = buildResolverIdentity(input)

  wikipediaImage =
    query || latin ? await resolvePhoto(query, latin, kingdom, identity).catch(() => null) : null

  const external = wikipediaImage ?? null

  if (external) {
    const photoSource = peekPhotoSource(buildPhotoCacheKey(query, latin, kingdom, identity))
    const source: ReferenceImageSource = photoSource === 'wikimedia' ? 'wikimedia' : 'wikipedia'
    const result: ResolvedImage = { uri: external, source, confidence: 0.7, reason: source }
    logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result })
    return result
  }

  // 5. No image found — caller renders category placeholder
  logResolved(input, { registryImage, domesticImage, inatImage, wikipediaImage, aiImage, result: null })
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
