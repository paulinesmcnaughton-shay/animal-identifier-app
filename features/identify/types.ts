import type { KingdomKey } from '@/design/atoms/KingdomBadge'

export type IdentifySource = 'inaturalist' | 'google'

export interface IdentResult {
  commonName: string
  kingdom: KingdomKey | null
  confidence: number
  source: IdentifySource
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
