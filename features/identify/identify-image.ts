import { canUseGoogleVision, isGenericAnimalName, scoreImageWithGoogleVision } from './google-vision'
import { canUseInaturalist, scoreImageWithInaturalist } from './inaturalist'
import { type IdentResult, IdentifyError } from './types'

const INAT_MIN_CONFIDENCE = 0.2
const SOFT_FAIL_CODES = new Set<IdentifyError['code']>(['NOT_LIVING', 'NO_RESULTS'])

function isSoftFail(error: IdentifyError): boolean {
  return SOFT_FAIL_CODES.has(error.code)
}

async function tryInaturalist(uri: string): Promise<{
  result: IdentResult | null
  error: IdentifyError | null
}> {
  if (!(await canUseInaturalist())) return { result: null, error: null }
  try {
    const result = await scoreImageWithInaturalist(uri)
    if (result.confidence >= INAT_MIN_CONFIDENCE) return { result, error: null }
    if (result.confidence > 0) return { result, error: null }
    return { result: null, error: null }
  } catch (error) {
    if (error instanceof IdentifyError) {
      if (isSoftFail(error)) return { result: null, error: null }
      return { result: null, error }
    }
    return { result: null, error: null }
  }
}

async function tryGoogleVision(uri: string): Promise<{
  result: IdentResult | null
  error: IdentifyError | null
}> {
  if (!canUseGoogleVision()) return { result: null, error: null }
  try {
    const result = await scoreImageWithGoogleVision(uri)
    return { result, error: null }
  } catch (error) {
    if (error instanceof IdentifyError) {
      if (isSoftFail(error)) return { result: null, error: null }
      return { result: null, error }
    }
    return { result: null, error: null }
  }
}

function pickBestResult(inat: IdentResult | null, google: IdentResult | null): IdentResult | null {
  if (!inat && !google) return null
  if (!inat) return google
  if (!google) return inat

  const inatGeneric = isGenericAnimalName(inat.commonName)
  const googleGeneric = isGenericAnimalName(google.commonName)

  if (inatGeneric && !googleGeneric) return google
  if (!inatGeneric && googleGeneric) return inat

  if (!inatGeneric && !googleGeneric) {
    if (google.commonName.length > inat.commonName.length + 2) return google
    return inat.confidence >= google.confidence ? inat : google
  }

  return google.confidence >= inat.confidence ? google : inat
}

export async function identifyAnimalOrPlant(uri: string): Promise<IdentResult> {
  const [inatTry, googleTry] = await Promise.all([tryInaturalist(uri), tryGoogleVision(uri)])
  const best = pickBestResult(inatTry.result, googleTry.result)
  if (best) return best

  if (inatTry.error) throw inatTry.error
  if (googleTry.error) throw googleTry.error

  const hasInat = await canUseInaturalist()
  const hasGoogle = canUseGoogleVision()

  if (!hasInat && !hasGoogle) {
    throw new IdentifyError(
      'Connect iNaturalist in Settings, or add GOOGLE_VISION_API_KEY in .env for pets.',
      'NO_TOKEN',
    )
  }

  if (!hasGoogle) {
    throw new IdentifyError(
      'For dogs and cats: add GOOGLE_VISION_API_KEY to .env, then restart npm start and shake to reload.',
      'NO_TOKEN',
    )
  }

  if (!hasInat) {
    throw new IdentifyError(
      'Connect iNaturalist in Settings for wildlife and plants.',
      'TOKEN_EXPIRED',
    )
  }

  throw new IdentifyError(
    'No animal or plant found — fill the frame with a creature or plant and try again.',
    'NOT_LIVING',
  )
}
