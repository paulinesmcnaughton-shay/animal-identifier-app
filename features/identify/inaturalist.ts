import Constants from 'expo-constants'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

import { canUseInaturalistAuth, resolveInaturalistJwt } from './inaturalist-auth'
import { type IdentResult, IdentifyError } from './types'

const SCORE_IMAGE_URL = 'https://api.inaturalist.org/v2/computervision/score_image'

const ICONIC_TAXON_MAP: Record<string, KingdomKey> = {
  Animalia: 'mammal',
  Mammalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Plantae: 'plant',
}

interface InatTaxon {
  preferred_common_name?: string
  name?: string
  iconic_taxon_name?: string
}

interface InatScoreRow {
  taxon?: InatTaxon
  combined_score?: number
}

function getEnvJwt(): string {
  const value = Constants.expoConfig?.extra?.inaturalistToken
  return typeof value === 'string' ? value.trim() : ''
}

export async function canUseInaturalist(): Promise<boolean> {
  return canUseInaturalistAuth()
}

async function resolveJwt(): Promise<string> {
  const envJwt = getEnvJwt()
  return resolveInaturalistJwt(envJwt || undefined)
}

function parseResults(json: unknown): IdentResult {
  const payload = json as { results?: InatScoreRow[]; errors?: { message?: string }[] }
  if (payload.errors?.length) {
    const msg = payload.errors.map((e) => e.message).filter(Boolean).join('; ')
    throw new IdentifyError(msg || 'Vision API error', 'API')
  }

  const top = payload.results?.[0]
  if (!top?.taxon) throw new IdentifyError('No species match for this photo', 'NO_RESULTS')

  const commonName =
    top.taxon.preferred_common_name?.trim() ||
    top.taxon.name?.trim() ||
    'Unknown species'
  const iconicName = top.taxon.iconic_taxon_name ?? ''
  const kingdom = ICONIC_TAXON_MAP[iconicName] ?? null
  if (!kingdom) {
    throw new IdentifyError('Not an animal or plant we recognize in this photo', 'NOT_LIVING')
  }
  const confidence = typeof top.combined_score === 'number' ? top.combined_score : 0

  return { commonName, kingdom, confidence, source: 'inaturalist' }
}

export async function scoreImageWithInaturalist(uri: string): Promise<IdentResult> {
  const jwt = await resolveJwt()

  const body = new FormData()
  body.append('image', {
    uri,
    name: 'photo.jpg',
    type: 'image/jpeg',
  } as unknown as Blob)

  let res: Response
  try {
    res = await fetch(SCORE_IMAGE_URL, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: jwt,
      },
      body,
    })
  } catch {
    throw new IdentifyError('Network error — check Wi‑Fi and try again.', 'NETWORK')
  }

  const responseText = await res.text()
  let json: unknown
  try {
    json = JSON.parse(responseText) as unknown
  } catch {
    throw new IdentifyError(`Invalid API response (${res.status})`, 'API')
  }

  if (res.status === 401) {
    throw new IdentifyError(
      'iNaturalist login expired. Open Settings → Connect iNaturalist.',
      'UNAUTHORIZED',
    )
  }
  if (!res.ok) {
    const errBody = json as { errors?: { message?: string }[] }
    const msg = errBody.errors?.[0]?.message ?? responseText.slice(0, 120)
    throw new IdentifyError(`Vision API ${res.status}: ${msg}`, 'API')
  }

  return parseResults(json)
}
