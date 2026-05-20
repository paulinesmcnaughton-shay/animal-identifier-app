import { slugifySpeciesName } from '@/data/species-catalog'
import { applyBreedAlias } from '@/features/identify/breed-aliases'
import {
  canUseClaudeVision,
  identifyWithClaudeVision,
  type ClaudeIdentPayload,
} from '@/features/identify/claude-vision'
import {
  canUseGoogleVision,
  detectImageCategory,
  mapLabelsToPipelineCategory,
} from '@/features/identify/google-vision'
import { isGenericAnimalName } from '@/features/identify/generic-animal-name'
import {
  canUseInaturalist,
  scoreImageWithInaturalist,
  scoreImageWithInaturalistIfConfident,
} from '@/features/identify/inaturalist'
import { enrichIdentResult } from '@/features/species/dex-number-registry'
import { kingdomKeyFromTaxonomy } from '@/features/species/kingdom-from-taxonomy'
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
  IdentifyError,
  MANUAL_PICKER_CONFIDENCE_THRESHOLD,
} from '@/features/identify/types'

interface InatTaxonResult {
  id: number
  preferred_common_name?: string
  name?: string
  iconic_taxon_name?: string
}

const INAT_ICONIC_MAP: Record<string, IdentResult['kingdom']> = {
  Animalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Plantae: 'plant',
  Fungi: 'plant',
}

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
  if (__DEV__) console.log(`[Wildr Pipeline] ${message}`)
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

function kingdomToPipelineCategory(kingdom: IdentResult['kingdom']): PipelineCategory {
  switch (kingdom) {
    case 'bird':
      return 'bird'
    case 'insect':
    case 'arachnid':
      return 'insect'
    case 'reptile':
    case 'amphibian':
      return 'reptile'
    case 'plant':
      return 'plant'
    case 'fish':
    case 'mollusc':
      return 'wild_mammal'
    case 'mammal':
      return 'wild_mammal'
    default:
      return 'unknown'
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

async function lookupWildTaxon(commonName: string): Promise<IdentResult | null> {
  const res = await fetch(
    `https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(commonName)}&per_page=1&rank=species,subspecies,variety`,
  )
  if (!res.ok) return null

  const json = (await res.json()) as { results?: InatTaxonResult[] }
  const taxon = json.results?.[0]
  if (!taxon) return null

  const iconic = taxon.iconic_taxon_name ?? 'Animalia'
  const resolvedName = taxon.preferred_common_name?.trim() || taxon.name?.trim() || commonName

  return enrichIdentResult(
    {
      commonName: resolvedName,
      kingdom: INAT_ICONIC_MAP[iconic] ?? 'mammal',
      confidence: MANUAL_PICKER_CONFIDENCE_THRESHOLD,
      source: 'inaturalist',
      latinName: taxon.name,
      isDomestic: false,
    },
    { inatTaxonId: taxon.id },
  )
}

async function resolveDomesticBreed(
  uri: string,
  breedName: string,
  confidence: number,
  source: IdentResult['source'],
  latinName?: string,
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

async function tryResolveInatAsDomestic(
  uri: string,
  inat: IdentResult,
): Promise<IdentifyOutcome | null> {
  if (inat.kingdom !== 'mammal') return null

  const petKind = inferPetKindFromLabels(inat.commonName, inat.latinName ?? '')
  const looksDomestic =
    petKind != null ||
    /\b(canis|felis|dog|cat|corgi|retriever|shepherd|terrier|poodle|beagle|bulldog|labrador)\b/i.test(
      `${inat.commonName} ${inat.latinName ?? ''}`,
    )

  if (!looksDomestic) return null
  if (needsBreedRefinement(inat.commonName)) return null

  return resolveDomesticBreed(uri, inat.commonName, inat.confidence, 'inaturalist', inat.latinName)
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

  const wild = await lookupWildTaxon(hint)
  if (!wild) return null

  pipelineLog(`Google species hint → iNat taxon: ${wild.commonName}`)
  return {
    status: 'identified',
    uri,
    result: {
      ...wild,
      confidence: Math.max(wild.confidence, 0.72),
      source: 'google',
    },
  }
}

async function tryInaturalistPrimary(uri: string): Promise<{
  outcome: IdentifyOutcome | null
  hint: IdentResult | null
}> {
  if (!(await canUseInaturalist())) {
    pipelineLog('iNaturalist unavailable')
    return { outcome: null, hint: null }
  }

  let hint: IdentResult | null = null

  try {
    const confident = await scoreImageWithInaturalistIfConfident(uri)
    if (confident) {
      pipelineLog(`iNat confident: ${confident.commonName} (${confident.confidence})`)
      const domestic = await tryResolveInatAsDomestic(uri, confident)
      if (domestic) return { outcome: domestic, hint: confident }
      return { outcome: { status: 'identified', uri, result: confident }, hint: confident }
    }
  } catch (error) {
    if (error instanceof IdentifyError && error.code === 'NOT_LIVING') {
      return { outcome: null, hint: null }
    }
    if (!(error instanceof IdentifyError && error.code === 'NO_RESULTS')) throw error
  }

  try {
    hint = await scoreImageWithInaturalist(uri)
    pipelineLog(`iNat below threshold: ${hint.commonName} (${hint.confidence})`)
  } catch (error) {
    if (error instanceof IdentifyError && (error.code === 'NO_RESULTS' || error.code === 'NOT_LIVING')) {
      return { outcome: null, hint: null }
    }
    throw error
  }

  return { outcome: null, hint }
}

async function routeDomesticAnthropicFallback(
  uri: string,
  category: PipelineCategory,
  visionLabels: string[],
  inatHint: IdentResult | null,
): Promise<IdentifyOutcome> {
  let claude: ClaudeIdentPayload | null = null

  if (canUseClaudeVision()) {
    pipelineLog('Anthropic fallback for domestic breed')
    try {
      claude = await identifyWithClaudeVision(uri, 'domestic_breed')
      pipelineLog(`Claude: ${claude.commonName} ${claude.confidence}`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Claude failed'
      pipelineLog(`Claude error: ${message}`)
    }
  }

  if (claude && !needsManualPicker(claude)) {
    const identified = await resolveDomesticBreed(
      uri,
      claude.commonName,
      claude.confidence,
      'claude',
      claude.latinName,
    )
    if (identified) return identified
  }

  if (inatHint && !needsBreedRefinement(inatHint.commonName)) {
    const fromInat = await resolveDomesticBreed(
      uri,
      inatHint.commonName,
      Math.max(inatHint.confidence, MANUAL_PICKER_CONFIDENCE_THRESHOLD),
      'inaturalist',
      inatHint.latinName,
    )
    if (fromInat) return fromInat
  }

  if (claude && claude.commonName !== 'Unknown') {
    const hintOutcome = await resolveDomesticBreed(
      uri,
      claude.commonName,
      Math.max(claude.confidence, MANUAL_PICKER_CONFIDENCE_THRESHOLD),
      'claude',
      claude.latinName,
    )
    if (hintOutcome) return hintOutcome
  }

  const mixed = resolveDomesticMixedBreedFallback(
    claude?.commonName ?? inatHint?.commonName ?? visionLabels[0] ?? 'dog',
    visionLabels,
    claude?.confidence ?? inatHint?.confidence ?? 0.45,
  )
  const mixedOutcome = await resolveDomesticBreed(
    uri,
    mixed.commonName,
    mixed.confidence,
    'claude',
  )
  if (mixedOutcome) {
    pipelineLog(`Domestic mixed-breed fallback: ${mixed.commonName}`)
    return mixedOutcome
  }

  return manualOutcome(uri, category, {
    hintCommonName:
      claude?.commonName && claude.commonName !== 'Unknown'
        ? applyBreedAlias(claude.commonName)
        : inatHint?.commonName,
    hintKingdom: 'mammal',
  })
}

async function routeWildAnthropicFallback(
  uri: string,
  category: PipelineCategory,
  visionLabels: string[],
  inatHint: IdentResult | null,
): Promise<IdentifyOutcome> {
  const visionHint = pickSpeciesHintFromLabels(visionLabels, category)
  const hintName =
    inatHint?.commonName && !isGenericAnimalName(inatHint.commonName)
      ? inatHint.commonName
      : visionHint ?? undefined

  if (!canUseClaudeVision()) {
    if (inatHint && inatHint.confidence > 0) {
      return { status: 'identified', uri, result: inatHint }
    }
    return manualOutcome(uri, category, {
      hintCommonName: hintName,
      hintKingdom: inatHint?.kingdom ?? undefined,
    })
  }

  pipelineLog('Anthropic fallback for wild species')
  let claude: ClaudeIdentPayload
  try {
    claude = await identifyWithClaudeVision(uri, 'wild_species')
    pipelineLog(`Claude: ${claude.commonName} ${claude.confidence}`)
  } catch (error) {
    if (inatHint && inatHint.confidence > 0) {
      return { status: 'identified', uri, result: inatHint }
    }
    throw error
  }

  if (needsManualPicker(claude)) {
    return manualOutcome(uri, category, {
      hintCommonName: claude.commonName !== 'Unknown' ? claude.commonName : hintName,
      hintKingdom: claude.kingdom ?? inatHint?.kingdom,
    })
  }

  const wild = await lookupWildTaxon(claude.commonName)
  if (wild) {
    return {
      status: 'identified',
      uri,
      result: {
        ...wild,
        confidence: Math.max(wild.confidence, claude.confidence),
        source: 'claude',
        latinName: claude.latinName || wild.latinName,
        isDomestic: false,
      },
    }
  }

  const kingdom = kingdomKeyFromTaxonomy(claude.kingdom)
  if (claude.confidence >= MANUAL_PICKER_CONFIDENCE_THRESHOLD) {
    return {
      status: 'identified',
      uri,
      result: enrichIdentResult({
        commonName: claude.commonName,
        kingdom,
        confidence: claude.confidence,
        source: 'claude',
        latinName: claude.latinName,
        isDomestic: false,
        lookupId: slugifySpeciesName(claude.commonName),
      }),
    }
  }

  return manualOutcome(uri, category, {
    hintCommonName: claude.commonName,
    hintKingdom: claude.kingdom,
  })
}

export async function runIdentificationPipeline(uri: string): Promise<IdentifyOutcome> {
  pipelineLog('Step 1: iNaturalist')
  const { outcome: inatOutcome, hint: inatHint } = await tryInaturalistPrimary(uri)
  if (inatOutcome) return inatOutcome

  pipelineLog('Step 2: Google Cloud Vision')
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

  if (category === 'unknown' && inatHint?.kingdom) {
    category = kingdomToPipelineCategory(inatHint.kingdom)
    if (inferPetKindFromLabels(inatHint.commonName, inatHint.latinName ?? '')) {
      category = inferPetKindFromLabels(inatHint.commonName, inatHint.latinName ?? '') === 'cat'
        ? 'domestic_cat'
        : 'domestic_dog'
    }
    pipelineLog(`Category from iNat hint: ${category}`)
  }

  if (category === 'unknown') {
    category = inferCategoryFromLabels(visionLabels)
    if (category !== 'unknown') pipelineLog(`Category from Google labels: ${category}`)
  }

  if (category === 'unknown') {
    const petKind = inferPetKindFromLabels(...visionLabels)
    if (petKind === 'dog') category = 'domestic_dog'
    else if (petKind === 'cat') category = 'domestic_cat'
    else if (/\b(bouquet|flower|floral|plant|rose|tulip|daisy)\b/.test(visionLabels.join(' '))) {
      category = 'plant'
    }
  }

  if (category === 'unknown' && !canUseClaudeVision()) {
    return manualOutcome(uri, category, {
      hintCommonName: inatHint?.commonName,
      hintKingdom: inatHint?.kingdom ?? undefined,
    })
  }

  pipelineLog('Step 3: Anthropic fallback')
  if (category === 'domestic_dog' || category === 'domestic_cat') {
    return routeDomesticAnthropicFallback(uri, category, visionLabels, inatHint)
  }

  if (WILD_CATEGORIES.includes(category)) {
    return routeWildAnthropicFallback(uri, category, visionLabels, inatHint)
  }

  if (canUseClaudeVision()) {
    const guessed =
      /\b(bouquet|flower|floral|plant|rose|garden|bloom)\b/i.test(visionLabels.join(' '))
        ? 'plant'
        : 'wild_mammal'
    return routeWildAnthropicFallback(uri, guessed, visionLabels, inatHint)
  }

  return manualOutcome(uri, category, {
    hintCommonName: inatHint?.commonName,
    hintKingdom: inatHint?.kingdom ?? undefined,
  })
}
