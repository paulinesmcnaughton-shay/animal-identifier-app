import type { KingdomKey } from '@/design/atoms/KingdomBadge'

export type PipelineCategory =
  | 'domestic_dog'
  | 'domestic_cat'
  | 'bird'
  | 'insect'
  | 'reptile'
  | 'plant'
  | 'wild_mammal'
  | 'unknown'

export type IdentifySource = 'claude' | 'inaturalist' | 'google' | 'manual'

export interface IdentResult {
  commonName: string
  kingdom: KingdomKey | null
  confidence: number
  source: IdentifySource
  latinName?: string
  isDomestic?: boolean
  lookupId?: string
  dexNumber?: string
}

export type IdentifyOutcome =
  | {
      status: 'identified'
      uri: string
      result: IdentResult
    }
  | {
      status: 'manual'
      uri: string
      category?: PipelineCategory
      hintCommonName?: string
      hintKingdom?: string
    }

export class IdentifyError extends Error {
  constructor(
    message: string,
    readonly code:
      | 'NO_TOKEN'
      | 'TOKEN_EXPIRED'
      | 'UNAUTHORIZED'
      | 'NETWORK'
      | 'API'
      | 'NO_RESULTS'
      | 'NOT_LIVING',
  ) {
    super(message)
    this.name = 'IdentifyError'
  }
}

export const MANUAL_PICKER_CONFIDENCE_THRESHOLD = 0.7
export const INATURALIST_CONFIDENCE_THRESHOLD = 0.65
