import { canUseAiGateway, invokeAiGateway } from './ai-gateway'
import { readImageBase64 } from './read-image-base64'
import { IdentifyError } from './types'

export type OpenAiVisionMode = 'domestic_breed' | 'wild_species'

export interface OpenAiIdentPayload {
  commonName: string
  latinName: string
  kingdom: string
  confidence: number
  isDomestic: boolean
  isGeneric: boolean
}

export function canUseOpenAiVision(): boolean {
  return canUseAiGateway()
}

function parsePayload(text: string, mode: OpenAiVisionMode): OpenAiIdentPayload {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new IdentifyError('OpenAI returned an unreadable response.', 'API')
  }

  const parsed = JSON.parse(stripped.slice(start, end + 1)) as Record<string, unknown>

  const commonName = typeof parsed.commonName === 'string' ? parsed.commonName.trim() : 'Unknown'
  const latinName = typeof parsed.latinName === 'string' ? parsed.latinName.trim() : ''
  const kingdom = typeof parsed.kingdom === 'string' ? parsed.kingdom.trim() : 'Animalia'
  const confidenceRaw = typeof parsed.confidence === 'number' ? parsed.confidence : Number(parsed.confidence)
  const confidence = Number.isFinite(confidenceRaw) ? Math.min(1, Math.max(0, confidenceRaw)) : 0

  return {
    commonName: commonName || 'Unknown',
    latinName,
    kingdom,
    confidence,
    isDomestic: typeof parsed.isDomestic === 'boolean' ? parsed.isDomestic : mode === 'domestic_breed',
    isGeneric: parsed.isGeneric === true,
  }
}

export async function identifyWithOpenAiVision(
  uri: string,
  mode: OpenAiVisionMode,
): Promise<OpenAiIdentPayload> {
  const base64 = await readImageBase64(uri)
  const { text } = await invokeAiGateway<{ text?: string }>({
    action: 'openai_identify',
    imageBase64: base64,
    mode,
  })

  if (!text) throw new IdentifyError('OpenAI returned an empty response.', 'API')

  if (__DEV__) console.log('[WildKind OpenAI] raw:', text)

  return parsePayload(text, mode)
}
