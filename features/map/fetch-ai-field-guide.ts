import Constants from 'expo-constants'

import type { NearbyFieldGuide, NearbySafetyLevel } from '@/features/map/nearby-field-guide'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.anthropicApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

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

  const apiKey = getApiKey()
  if (!apiKey) return null

  const label = latinName ? `${commonName} (${latinName})` : commonName
  const prompt =
    `You are a wildlife field guide expert. Write a concise field guide entry for ${label}.\n` +
    'Respond ONLY with JSON, no explanation:\n' +
    '{"whatIsIt":"2-3 sentences on appearance, habitat, and behavior.","safetyLevel":"low","safetyNote":"1-2 sentences on safety for observers.","approachTip":"1-2 sentences on getting close for a good photo.","bestTimeToSpot":"1 sentence on ideal time."}\n' +
    'safetyLevel must be "low", "moderate", or "high". Keep each value under 100 words. Tone: warm, naturalist, encouraging.'

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 512,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!res.ok) return null

    const json = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>
    }
    const text = json.content?.find((b) => b.type === 'text')?.text ?? ''
    const start = text.indexOf('{')
    const end = text.lastIndexOf('}')
    if (start < 0 || end <= start) return null

    const parsed = JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>

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
  } catch {
    return null
  }
}
