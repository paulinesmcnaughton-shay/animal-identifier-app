import { slugifySpeciesName } from '@/data/species-catalog'
import { applyBreedAlias } from '@/features/identify/breed-aliases'
import {
  canUseClaudeVision,
  identifyWithClaudeVision,
  type ClaudeIdentPayload,
} from '@/features/identify/claude-vision'
import {
  canUseOpenAiVision,
  identifyWithOpenAiVision,
  type OpenAiIdentPayload,
} from '@/features/identify/openai-vision'
import {
  canUseGoogleVision,
  detectImageCategory,
  mapLabelsToPipelineCategory,
} from '@/features/identify/google-vision'
import { isGenericAnimalName } from '@/features/identify/generic-animal-name'
import { lookupSpeciesInGbif } from '@/features/identify/gbif'
import { enrichIdentResult } from '@/features/species/dex-number-registry'
import { classifyPlantType, kingdomKeyFromTaxonomy } from '@/features/species/kingdom-from-taxonomy'
import { fetchDomesticSpeciesFromSupabase } from '@/features/species/fetch-domestic-species'
import {
  inferPetKindFromLabels,
  needsBreedRefinement,
  resolveDomesticMixedBreedFallback,
} from '@/features/species/domestic-ident'
import {
  type IdentResult,
  type IdentifyOutcome,
  type PipelineCategory,
  MANUAL_PICKER_CONFIDENCE_THRESHOLD,
} from '@/features/identify/types'

const WILD_CATEGORIES: PipelineCategory[] = [
  'bird',
  'insect',
  'reptile',
  'plant',
  'wild_mammal',
]

const GENERIC_VISION_LABEL =
  /^(plant|flower|tree|shrub|herb|grass|leaf|foliage|animal|mammal|bird|insect|reptile|organism|living thing|natural|wildlife|fauna|flora|vertebrate|invertebrate|bouquet|floral design|flower bouquet|cut flowers|garden|petal|bloom|flowering plant|houseplant|domestic dog|domestic cat|dog|cat|puppy|kitten|canine|feline)$/i

function pipelineLog(message: string): void {
  if (__DEV__) console.log(`[WildKind Pipeline] ${message}`)
}

function needsManualPicker(payload: {
  commonName: string
  confidence: number
  isGeneric: boolean
}): boolean {
  if (payload.confidence <= 0) return true
  if (payload.commonName.toLowerCase() === 'unknown') return true
  if (payload.isGeneric) return true
  if (payload.confidence < MANUAL_PICKER_CONFIDENCE_THRESHOLD) return true
  return false
}

function manualOutcome(
  uri: string,
  category: PipelineCategory,
  hints?: { hintCommonName?: string; hintKingdom?: string },
): IdentifyOutcome {
  pipelineLog('Routing to manual picker')
  return {
    status: 'manual',
    uri,
    category,
    hintCommonName: hints?.hintCommonName,
    hintKingdom: hints?.hintKingdom,
  }
}

function inferCategoryFromLabels(labels: string[]): PipelineCategory {
  if (labels.length === 0) return 'unknown'
  return mapLabelsToPipelineCategory(labels)
}

function titleCaseLabel(label: string): string {
  return label
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function pickSpeciesHintFromLabels(labels: string[], category: PipelineCategory): string | null {
  for (const raw of labels) {
    const label = raw.trim().toLowerCase()
    if (!label || GENERIC_VISION_LABEL.test(label)) continue
    if (category === 'plant' && /\b(rose|tulip|daisy|sunflower|lily|orchid|peony|carnation|daffodil|hydrangea|lavender|poppy|iris|chrysanthemum|marigold|zinnia|dahlia|magnolia|bouquet)\b/.test(label)) {
      return titleCaseLabel(label)
    }
    if (category !== 'plant' && label.length > 2 && !isGenericAnimalName(label)) {
      return titleCaseLabel(label)
    }
  }
  return null
}

async function resolveDomesticBreed(
  uri: string,
  breedName: string,
  confidence: number,
  source: IdentResult['source'],
): Promise<IdentifyOutcome | null> {
  const canonical = applyBreedAlias(breedName)
  const domestic = await fetchDomesticSpeciesFromSupabase(
    slugifySpeciesName(canonical),
    canonical,
  )

  if (!domestic) return null

  return {
    status: 'identified',
    uri,
    result: {
      commonName: domestic.detail.commonName,
      kingdom: domestic.detail.kingdom,
      confidence,
      source,
      latinName: domestic.detail.latinName,
      isDomestic: true,
      lookupId: domestic.detail.id,
      dexNumber: domestic.detail.dexNumber,
    },
  }
}

async function tryResolveDomesticFromVisionLabels(
  uri: string,
  labels: string[],
): Promise<IdentifyOutcome | null> {
  if (labels.length === 0) return null

  const joined = labels.join(' ')
  const kind = inferPetKindFromLabels(joined)
  if (!kind) return null

  for (const label of labels) {
    const canonical = applyBreedAlias(label)
    if (canonical !== label || !needsBreedRefinement(canonical, labels)) {
      const resolved = await resolveDomesticBreed(uri, canonical, 0.78, 'google')
      if (resolved) {
        pipelineLog(`Google breed match: ${canonical}`)
        return resolved
      }
    }
  }

  const aliasFromJoin = applyBreedAlias(labels[0] ?? '')
  if (!needsBreedRefinement(aliasFromJoin, labels)) {
    const resolved = await resolveDomesticBreed(uri, aliasFromJoin, 0.72, 'google')
    if (resolved) {
      pipelineLog(`Google breed match (top label): ${aliasFromJoin}`)
      return resolved
    }
  }

  return null
}

async function tryResolveWildFromVisionLabels(
  uri: string,
  labels: string[],
  category: PipelineCategory,
): Promise<IdentifyOutcome | null> {
  if (!WILD_CATEGORIES.includes(category)) return null

  const hint = pickSpeciesHintFromLabels(labels, category)
  if (!hint) return null

  const wild = await lookupSpeciesInGbif(hint)
  if (!wild) return null

  pipelineLog(`Google species hint → GBIF taxon: ${wild.commonName}`)
  return {
    status: 'identified',
    uri,
    result: {
      ...wild,
      confidence: Math.max(wild.confidence, 0.72),
      source: 'gbif',
    },
  }
}

type AiPayload = ClaudeIdentPayload | OpenAiIdentPayload

async function tryAiIdentification(
  uri: string,
  mode: 'domestic_breed' | 'wild_species',
): Promise<{ payload: AiPayload; source: 'claude' | 'openai' } | null> {
  if (canUseClaudeVision()) {
    try {
      const payload = await identifyWithClaudeVision(uri, mode)
      pipelineLog(`Claude: ${payload.commonName} ${payload.confidence}`)
      return { payload, source: 'claude' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claude failed'
      pipelineLog(`Claude error: ${message}`)
    }
  }

  if (canUseOpenAiVision()) {
    try {
      const payload = await identifyWithOpenAiVision(uri, mode)
      pipelineLog(`OpenAI: ${payload.commonName} ${payload.confidence}`)
      return { payload, source: 'openai' }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'OpenAI failed'
      pipelineLog(`OpenAI error: ${message}`)
    }
  }

  return null
}

function aiResultAsIdentified(
  uri: string,
  ai: { payload: AiPayload; source: 'claude' | 'openai' },
  confidence?: number,
): IdentifyOutcome {
  const baseKingdom = kingdomKeyFromTaxonomy(ai.payload.kingdom) ?? 'mammal'
  const kingdom = baseKingdom === 'plant'
    ? classifyPlantType(ai.payload.commonName, ai.payload.latinName)
    : baseKingdom
  return {
    status: 'identified',
    uri,
    result: enrichIdentResult({
      commonName: ai.payload.commonName,
      kingdom,
      confidence: confidence ?? ai.payload.confidence,
      source: ai.source,
      latinName: ai.payload.latinName,
      isDomestic: ai.payload.isDomestic,
      lookupId: slugifySpeciesName(ai.payload.commonName),
    }),
  }
}

async function routeDomesticFallback(
  uri: string,
  category: PipelineCategory,
  visionLabels: string[],
): Promise<IdentifyOutcome> {
  const ai = await tryAiIdentification(uri, 'domestic_breed')

  if (ai && !needsManualPicker(ai.payload)) {
    // Try Supabase for rich breed data; fall back to AI result directly if not catalogued
    const identified = await resolveDomesticBreed(uri, ai.payload.commonName, ai.payload.confidence, ai.source)
    if (identified) return identified
    return aiResultAsIdentified(uri, ai)
  }

  // Try mixed-breed Supabase fallback
  const mixed = resolveDomesticMixedBreedFallback(
    ai?.payload.commonName ?? visionLabels[0] ?? 'dog',
    visionLabels,
    ai?.payload.confidence ?? 0.45,
  )
  const mixedOutcome = await resolveDomesticBreed(uri, mixed.commonName, mixed.confidence, 'google')
  if (mixedOutcome) {
    pipelineLog(`Domestic mixed-breed fallback: ${mixed.commonName}`)
    return mixedOutcome
  }

  // AI gave us something below threshold but still useful — return it at minimum confidence
  if (ai && ai.payload.commonName !== 'Unknown') {
    return aiResultAsIdentified(uri, ai, Math.max(ai.payload.confidence, MANUAL_PICKER_CONFIDENCE_THRESHOLD))
  }

  const genericBreedHint = category === 'domestic_cat' ? 'Domestic Cat' : 'Mixed Breed Dog'
  return manualOutcome(uri, category, {
    hintCommonName: ai?.payload.commonName && ai.payload.commonName !== 'Unknown'
      ? applyBreedAlias(ai.payload.commonName)
      : genericBreedHint,
    hintKingdom: 'mammal',
  })
}

async function routeWildFallback(
  uri: string,
  category: PipelineCategory,
  visionLabels: string[],
): Promise<IdentifyOutcome> {
  const visionHint = pickSpeciesHintFromLabels(visionLabels, category)

  const ai = await tryAiIdentification(uri, 'wild_species')

  const categoryFallbackHint: Partial<Record<PipelineCategory, string>> = {
    bird: 'Unknown Bird',
    insect: 'Unknown Insect',
    reptile: 'Unknown Reptile',
    plant: 'Unknown Plant',
    wild_mammal: 'Unknown Animal',
  }
  const wildFallbackHint = visionHint ?? categoryFallbackHint[category]

  if (!ai) {
    return manualOutcome(uri, category, {
      hintCommonName: wildFallbackHint,
    })
  }

  if (ai.payload.isDomestic) {
    const name = ai.payload.commonName !== 'Unknown' ? ai.payload.commonName : null
    if (name) {
      const identified = await resolveDomesticBreed(uri, name, ai.payload.confidence, ai.source)
      if (identified) return identified
      if (ai.payload.confidence > 0) return aiResultAsIdentified(uri, ai)
    }
    const petKind = /\b(cat|feline|kitten|tabby)\b/i.test(ai.payload.commonName) ? 'cat' : 'dog'
    return manualOutcome(uri, category, {
      hintCommonName: petKind === 'cat' ? 'Domestic Cat' : 'Mixed Breed Dog',
      hintKingdom: 'mammal',
    })
  }

  if (needsManualPicker(ai.payload)) {
    return manualOutcome(uri, category, {
      hintCommonName: ai.payload.commonName !== 'Unknown' ? ai.payload.commonName : wildFallbackHint,
      hintKingdom: ai.payload.kingdom,
    })
  }

  const wild = await lookupSpeciesInGbif(ai.payload.commonName)
  if (wild) {
    return {
      status: 'identified',
      uri,
      result: {
        ...wild,
        confidence: Math.max(wild.confidence, ai.payload.confidence),
        source: ai.source,
        latinName: ai.payload.latinName || wild.latinName,
        isDomestic: false,
      },
    }
  }

  const baseKingdom2 = kingdomKeyFromTaxonomy(ai.payload.kingdom)
  const kingdom = baseKingdom2 === 'plant'
    ? classifyPlantType(ai.payload.commonName, ai.payload.latinName)
    : baseKingdom2
  if (ai.payload.confidence >= MANUAL_PICKER_CONFIDENCE_THRESHOLD) {
    return {
      status: 'identified',
      uri,
      result: enrichIdentResult({
        commonName: ai.payload.commonName,
        kingdom,
        confidence: ai.payload.confidence,
        source: ai.source,
        latinName: ai.payload.latinName,
        isDomestic: false,
        lookupId: slugifySpeciesName(ai.payload.commonName),
      }),
    }
  }

  return manualOutcome(uri, category, {
    hintCommonName: ai.payload.commonName !== 'Unknown' ? ai.payload.commonName : wildFallbackHint,
    hintKingdom: ai.payload.kingdom,
  })
}

export async function runIdentificationPipeline(uri: string): Promise<IdentifyOutcome> {
  pipelineLog('Step 1: Google Cloud Vision')
  let category: PipelineCategory = 'unknown'
  let visionLabels: string[] = []

  if (canUseGoogleVision()) {
    try {
      const scan = await detectImageCategory(uri)
      category = scan.category
      visionLabels = scan.topLabels
      pipelineLog(`Google category: ${category}`)
      if (__DEV__ && visionLabels.length > 0) {
        pipelineLog(`Google labels: ${visionLabels.slice(0, 10).join(', ')}`)
      }

      const domesticFromGoogle = await tryResolveDomesticFromVisionLabels(uri, visionLabels)
      if (domesticFromGoogle) return domesticFromGoogle

      const wildFromGoogle = await tryResolveWildFromVisionLabels(uri, visionLabels, category)
      if (wildFromGoogle) return wildFromGoogle
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Vision failed'
      pipelineLog(`Google error: ${message}`)
    }
  } else {
    pipelineLog('Google Vision unavailable')
  }

  if (category === 'unknown') {
    const petKind = inferPetKindFromLabels(...visionLabels)
    if (petKind === 'dog') category = 'domestic_dog'
    else if (petKind === 'cat') category = 'domestic_cat'
    else if (/\b(bouquet|flower|floral|plant|rose|tulip|daisy)\b/.test(visionLabels.join(' '))) {
      category = 'plant'
    }
  }

  if (category === 'unknown') {
    category = inferCategoryFromLabels(visionLabels)
    if (category !== 'unknown') pipelineLog(`Category from labels: ${category}`)
  }

  pipelineLog('Step 2: AI identification (Claude → OpenAI)')
  if (category === 'domestic_dog' || category === 'domestic_cat') {
    return routeDomesticFallback(uri, category, visionLabels)
  }

  if (WILD_CATEGORIES.includes(category)) {
    return routeWildFallback(uri, category, visionLabels)
  }

  if (canUseClaudeVision() || canUseOpenAiVision()) {
    const guessed =
      /\b(bouquet|flower|floral|plant|rose|garden|bloom)\b/i.test(visionLabels.join(' '))
        ? 'plant'
        : 'wild_mammal'
    return routeWildFallback(uri, guessed, visionLabels)
  }

  return manualOutcome(uri, category, { hintCommonName: 'Unknown Species' })
}
