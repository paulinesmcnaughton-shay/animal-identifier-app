import Constants from 'expo-constants'

import { readImageBase64 } from './read-image-base64'
import { IdentifyError } from './types'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const CLAUDE_MODELS = ['claude-sonnet-4-20250514', 'claude-opus-4-20250514'] as const
const ANTHROPIC_VERSION = '2023-06-01'

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

export type ClaudeVisionMode = 'domestic_breed' | 'wild_species'

export interface ClaudeIdentPayload {
  commonName: string
  latinName: string
  kingdom: string
  confidence: number
  isDomestic: boolean
  isGeneric: boolean
}

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.anthropicApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

export function canUseClaudeVision(): boolean {
  return getApiKey().length > 0
}

function systemPromptForMode(mode: ClaudeVisionMode): string {
  return mode === 'domestic_breed' ? DOMESTIC_BREED_PROMPT : WILD_SPECIES_PROMPT
}

function parseClaudePayload(text: string, mode: ClaudeVisionMode): ClaudeIdentPayload {
  const stripped = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '')
  const start = stripped.indexOf('{')
  const end = stripped.lastIndexOf('}')
  if (start < 0 || end <= start) {
    throw new IdentifyError('Claude returned an unreadable response.', 'API')
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
    isDomestic: mode === 'domestic_breed' ? true : false,
    isGeneric: parsed.isGeneric === true,
  }
}

export async function identifyWithClaudeVision(
  uri: string,
  mode: ClaudeVisionMode,
): Promise<ClaudeIdentPayload> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new IdentifyError('Add ANTHROPIC_API_KEY to .env to identify species.', 'NO_TOKEN')
  }

  const base64 = await readImageBase64(uri)
  const userText =
    mode === 'domestic_breed'
      ? 'Identify the dog or cat breed in this image.'
      : 'Identify the wild species in this image.'

  let lastError: IdentifyError | null = null

  for (const model of CLAUDE_MODELS) {
    let res: Response
    try {
      res = await fetch(ANTHROPIC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model,
          max_tokens: 256,
          system: systemPromptForMode(mode),
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: 'image/jpeg',
                    data: base64,
                  },
                },
                { type: 'text', text: userText },
              ],
            },
          ],
        }),
      })
    } catch {
      throw new IdentifyError('Network error — check Wi‑Fi and try again.', 'NETWORK')
    }

    const json = (await res.json()) as {
      error?: { message?: string; type?: string }
      content?: Array<{ type?: string; text?: string }>
    }

    if (!res.ok) {
      const message = json.error?.message ?? `Claude API ${res.status}`
      if (__DEV__) console.warn(`[Wildr Claude] ${model} failed:`, message)
      lastError = new IdentifyError(message, 'API')
      continue
    }

    const text = json.content?.find((block) => block.type === 'text')?.text
    if (!text) {
      lastError = new IdentifyError('Claude returned an empty response.', 'API')
      continue
    }

    if (__DEV__) console.log(`[Wildr Claude] ${model} raw:`, text)

    return parseClaudePayload(text, mode)
  }

  throw lastError ?? new IdentifyError('Claude vision is unavailable right now.', 'API')
}
