import Constants from 'expo-constants'

import { readImageBase64 } from './read-image-base64'
import { IdentifyError } from './types'

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4o'

const DOMESTIC_BREED_PROMPT = `You are an expert dog and cat breed identifier.
Identify the exact breed in this photo.
Respond ONLY with JSON, no preamble:
{
  "commonName": "Pembroke Welsh Corgi",
  "latinName": "Canis lupus familiaris",
  "kingdom": "Mammalia",
  "confidence": 0.92,
  "isDomestic": true,
  "isGeneric": false
}
Set isGeneric: true only if you cannot identify a specific breed.
Set confidence between 0 and 1.
If you truly cannot identify anything, set commonName to "Unknown" and confidence to 0.`

const WILD_SPECIES_PROMPT = `You are a wildlife identification expert.
Identify the exact species in this photo.
Respond ONLY with JSON:
{
  "commonName": "Monarch Butterfly",
  "latinName": "Danaus plexippus",
  "kingdom": "Insecta",
  "confidence": 0.88,
  "isDomestic": false,
  "isGeneric": false
}
Set isGeneric: true if you can only identify a general category without a specific species.
Set confidence between 0 and 1.
If you truly cannot identify anything, set commonName to "Unknown" and confidence to 0.`

export type OpenAiVisionMode = 'domestic_breed' | 'wild_species'

export interface OpenAiIdentPayload {
  commonName: string
  latinName: string
  kingdom: string
  confidence: number
  isDomestic: boolean
  isGeneric: boolean
}

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.openAiApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

export function canUseOpenAiVision(): boolean {
  return getApiKey().length > 0
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
    isDomestic: mode === 'domestic_breed',
    isGeneric: parsed.isGeneric === true,
  }
}

export async function identifyWithOpenAiVision(
  uri: string,
  mode: OpenAiVisionMode,
): Promise<OpenAiIdentPayload> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new IdentifyError('Add OPENAI_API_KEY to .env to identify species.', 'NO_TOKEN')
  }

  const base64 = await readImageBase64(uri)
  const systemPrompt = mode === 'domestic_breed' ? DOMESTIC_BREED_PROMPT : WILD_SPECIES_PROMPT
  const userText =
    mode === 'domestic_breed'
      ? 'Identify the dog or cat breed in this image.'
      : 'Identify the wild species in this image.'

  let res: Response
  try {
    res = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 256,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${base64}`, detail: 'low' },
              },
              { type: 'text', text: userText },
            ],
          },
        ],
      }),
    })
  } catch {
    throw new IdentifyError('Network error — check Wi-Fi and try again.', 'NETWORK')
  }

  const json = (await res.json()) as {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string } }>
  }

  if (!res.ok) {
    const message = json.error?.message ?? `OpenAI API ${res.status}`
    if (__DEV__) console.warn('[WildKind OpenAI] failed:', message)
    throw new IdentifyError(message, 'API')
  }

  const text = json.choices?.[0]?.message?.content
  if (!text) throw new IdentifyError('OpenAI returned an empty response.', 'API')

  if (__DEV__) console.log('[WildKind OpenAI] raw:', text)

  return parsePayload(text, mode)
}
