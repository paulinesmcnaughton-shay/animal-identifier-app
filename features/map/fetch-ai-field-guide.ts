import { canUseAiGateway, invokeAiGateway } from '@/features/identify/ai-gateway'
import type { NearbyFieldGuide, NearbySafetyLevel } from '@/features/map/nearby-field-guide'

function isSafetyLevel(val: unknown): val is NearbySafetyLevel {
  return val === 'low' || val === 'moderate' || val === 'high'
}

const guideCache = new Map<string, NearbyFieldGuide>()

export async function fetchAiFieldGuide(
  commonName: string,
  latinName?: string | null,
): Promise<NearbyFieldGuide | null> {
  const cacheKey = (latinName || commonName).toLowerCase().trim()
  if (guideCache.has(cacheKey)) return guideCache.get(cacheKey)!

  if (!canUseAiGateway()) return null

  let parsed: Record<string, unknown> | null = null
  try {
    const { guide } = await invokeAiGateway<{ guide?: Record<string, unknown> | null }>({
      action: 'field_guide',
      commonName,
      latinName: latinName ?? null,
    })
    parsed = guide ?? null
  } catch {
    return null
  }

  if (!parsed) return null

  const guide: NearbyFieldGuide = {
    whatIsIt: typeof parsed.whatIsIt === 'string' ? parsed.whatIsIt : '',
    safetyLevel: isSafetyLevel(parsed.safetyLevel) ? parsed.safetyLevel : 'low',
    safetyNote: typeof parsed.safetyNote === 'string' ? parsed.safetyNote : '',
    approachTip: typeof parsed.approachTip === 'string' ? parsed.approachTip : '',
    bestTimeToSpot: typeof parsed.bestTimeToSpot === 'string' ? parsed.bestTimeToSpot : '',
  }

  if (!guide.whatIsIt) return null

  guideCache.set(cacheKey, guide)
  return guide
}
