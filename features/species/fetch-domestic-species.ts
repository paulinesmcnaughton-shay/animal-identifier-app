import { slugifySpeciesName } from '@/data/species-catalog'
import { isGenericAnimalName } from '@/features/identify/generic-animal-name'
import {
  DOMESTIC_DEX_CAT,
  DOMESTIC_DEX_DOG,
  inferPetKindFromLabels,
} from '@/features/species/domestic-ident'
import {
  mapDomesticSpeciesRowToDetail,
  type DomesticSpeciesRow,
} from '@/features/species/map-domestic-species'
import type { SpeciesDetailFetchResult } from '@/features/species/types'
import { getSupabaseClient } from '@/lib/supabase/client'

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function slugToCommonNameGuess(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function rowToResult(row: DomesticSpeciesRow): SpeciesDetailFetchResult {
  const referenceUrl = row.reference_image_url?.trim() || null
  if (__DEV__) {
    console.log('[WildKind domestic_species] row matched:', {
      id: row.id,
      common_name: row.common_name,
      dex_number: row.dex_number,
      reference_image_url: referenceUrl,
    })
  }
  return {
    detail: mapDomesticSpeciesRowToDetail(row),
    imageUrl: referenceUrl,
    isDomestic: true,
    latinNameSource: 'domestic_species.latin_name',
  }
}

async function fetchRowByDex(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  dexNumber: string,
): Promise<DomesticSpeciesRow | null> {
  const { data, error } = await supabase
    .from('domestic_species')
    .select('*')
    .eq('dex_number', dexNumber)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

async function fetchByCommonNameFuzzy(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  name: string,
): Promise<DomesticSpeciesRow | null> {
  const trimmed = name.trim()
  if (!trimmed) return null

  const { data: exact, error: exactError } = await supabase
    .from('domestic_species')
    .select('*')
    .ilike('common_name', trimmed)
    .maybeSingle()

  if (exactError) throw new Error(exactError.message)
  if (exact) return exact

  if (isGenericAnimalName(trimmed)) {
    const kind = inferPetKindFromLabels(trimmed)
    const dex = kind === 'cat' ? DOMESTIC_DEX_CAT : DOMESTIC_DEX_DOG
    const mixed = await fetchRowByDex(supabase, dex)
    if (mixed) return mixed
  }

  const { data: containsRows, error: containsError } = await supabase
    .from('domestic_species')
    .select('*')
    .ilike('common_name', `%${trimmed}%`)
    .order('common_name')
    .limit(5)

  if (containsError) throw new Error(containsError.message)
  if (containsRows && containsRows.length > 0) {
    const exactWord = containsRows.find(
      (row) => row.common_name.toLowerCase() === trimmed.toLowerCase(),
    )
    return exactWord ?? containsRows[0]
  }

  const tokens = trimmed.split(/\s+/).filter((t) => t.length > 2)
  for (let i = tokens.length - 1; i >= 0; i -= 1) {
    const token = tokens[i]
    const { data: tokenRows, error: tokenError } = await supabase
      .from('domestic_species')
      .select('*')
      .ilike('common_name', `%${token}%`)
      .order('common_name')
      .limit(3)

    if (tokenError) throw new Error(tokenError.message)
    if (tokenRows && tokenRows.length > 0) return tokenRows[0]
  }

  return null
}

export interface FetchDomesticSpeciesOptions {
  /** Fuzzy common-name search — only for confirmed domestic flows (identify/picker). */
  allowFuzzyNameSearch?: boolean
}

export async function fetchDomesticSpeciesFromSupabase(
  lookupId: string,
  commonNameHint?: string,
  options?: FetchDomesticSpeciesOptions,
): Promise<SpeciesDetailFetchResult | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const safeId = lookupId.replace(/[^a-zA-Z0-9#_-]/g, '')
  const nameHint = commonNameHint?.trim()
  const allowFuzzyName = options?.allowFuzzyNameSearch ?? true

  if (nameHint && allowFuzzyName) {
    const byName = await fetchByCommonNameFuzzy(supabase, nameHint)
    if (byName) return rowToResult(byName)
  }

  if (!safeId) return null

  if (UUID_RE.test(safeId)) {
    const { data, error } = await supabase
      .from('domestic_species')
      .select('*')
      .eq('id', safeId)
      .maybeSingle()

    if (error) throw new Error(error.message)
    if (data) return rowToResult(data)
  }

  const dexCandidates = [safeId, safeId.startsWith('#') ? safeId : `#${safeId}`]

  for (const dexNumber of dexCandidates) {
    const row = await fetchRowByDex(supabase, dexNumber)
    if (row) return rowToResult(row)
  }

  if (safeId === DOMESTIC_DEX_DOG || safeId === 'D001') {
    const row = await fetchRowByDex(supabase, DOMESTIC_DEX_DOG)
    if (row) return rowToResult(row)
  }
  if (safeId === DOMESTIC_DEX_CAT || safeId === 'D051') {
    const row = await fetchRowByDex(supabase, DOMESTIC_DEX_CAT)
    if (row) return rowToResult(row)
  }

  if (allowFuzzyName) {
    const nameGuess = slugToCommonNameGuess(slugifySpeciesName(safeId))
    const bySlugName = await fetchByCommonNameFuzzy(supabase, nameGuess)
    if (bySlugName) return rowToResult(bySlugName)
  }

  return null
}
