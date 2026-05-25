import Constants from 'expo-constants'

import type { NearbyMapSighting } from '@/features/map/map-sighting'
import { parseKingdom } from '@/features/map/mock-map-data'
import type { MapCoordinate } from '@/features/map/use-user-location'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.anthropicApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

interface AiSpeciesSuggestion {
  commonName: string
  latinName: string
  kingdom: string
}

async function queryClaudeForSpecies(
  lat: number,
  lng: number,
): Promise<AiSpeciesSuggestion[]> {
  const apiKey = getApiKey()
  if (!apiKey) return []

  const month = MONTH_NAMES[new Date().getMonth()] ?? 'Unknown'

  const prompt =
    `You are a wildlife expert. For the location at latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)} in ${month}, list 6 wild animal species commonly observable by a casual nature enthusiast outdoors.\n` +
    'Respond ONLY with a JSON array, no explanation:\n' +
    '[{"commonName":"Red Fox","latinName":"Vulpes vulpes","kingdom":"mammal"},...]\n' +
    'kingdom must be one of: mammal, bird, reptile, amphibian, fish, insect, arachnid, mollusc.\n' +
    'Only include species that genuinely occur in that region and season.'

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

    if (!res.ok) return []

    const json = (await res.json()) as {
      content?: Array<{ type?: string; text?: string }>
    }
    const text = json.content?.find((b) => b.type === 'text')?.text ?? ''
    const start = text.indexOf('[')
    const end = text.lastIndexOf(']')
    if (start < 0 || end <= start) return []

    return JSON.parse(text.slice(start, end + 1)) as AiSpeciesSuggestion[]
  } catch {
    return []
  }
}

export async function fetchAiNearbySightings(
  userCoord: MapCoordinate,
): Promise<NearbyMapSighting[]> {
  const [lng, lat] = userCoord
  const suggestions = await queryClaudeForSpecies(lat, lng)

  return suggestions.map(
    (s, i): NearbyMapSighting => ({
      id: `ai-${s.latinName.replace(/\s+/g, '-').toLowerCase()}-${i}`,
      name: s.commonName,
      speciesId: s.commonName.toLowerCase().replace(/\s+/g, '-'),
      scientificName: s.latinName,
      kingdom: parseKingdom(s.kingdom),
      lat,
      lng,
      date: 'Commonly seen here',
      count: 1,
      distanceM: 0,
      source: 'ai',
      explorerCount: 0,
      isVerified: false,
      spottedByUsername: null,
    }),
  )
}
