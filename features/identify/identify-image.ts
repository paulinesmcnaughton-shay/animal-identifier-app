import { canUseGoogleVision, isGenericAnimalName, scoreImageWithGoogleVision } from './google-vision'
import { canUseInaturalist, scoreImageWithInaturalist } from './inaturalist'
import { type IdentResult, IdentifyError } from './types'

const INAT_MIN_CONFIDENCE = 0.2

async function tryInaturalist(uri: string): Promise<IdentResult | null> {
  if (!(await canUseInaturalist())) return null
  try {
    const result = await scoreImageWithInaturalist(uri)
    if (result.confidence >= INAT_MIN_CONFIDENCE) return result
    return result.confidence > 0 ? result : null
  } catch (error) {
    if (error instanceof IdentifyError && error.code === 'NOT_LIVING') return null
    return null
  }
}

async function tryGoogleVision(uri: string): Promise<IdentResult | null> {
  if (!canUseGoogleVision()) return null
  try {
    return await scoreImageWithGoogleVision(uri)
  } catch {
    return null
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
  const [inat, google] = await Promise.all([tryInaturalist(uri), tryGoogleVision(uri)])
  const best = pickBestResult(inat, google)
  if (best) return best

  const hasInat = await canUseInaturalist()
  if (!hasInat && !canUseGoogleVision()) {
    throw new IdentifyError(
      'Connect iNaturalist in Settings for wildlife and plants. Add GOOGLE_VISION_API_KEY in .env for home pets.',
      'NO_TOKEN',
    )
  }

  if (!canUseGoogleVision()) {
    throw new IdentifyError(
      'For home pets (dogs, cats, bunnies, hamsters), add GOOGLE_VISION_API_KEY to .env and restart npm start.',
      'NO_TOKEN',
    )
  }

  if (!hasInat) {
    throw new IdentifyError(
      'Connect iNaturalist in Settings (one-time) to identify wildlife and plants.',
      'TOKEN_EXPIRED',
    )
  }

  throw new IdentifyError(
    'No animal or plant found — fill the frame with a creature or plant and try again.',
    'NOT_LIVING',
  )
}
