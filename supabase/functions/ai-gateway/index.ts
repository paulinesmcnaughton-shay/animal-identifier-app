// AI gateway — proxies every third-party AI call the app makes so provider
// API keys live only in Supabase secrets, never in the shipped binary.
//
// Actions:
//   claude_identify  { imageBase64, mode }        → { text }   (raw Claude text, client parses)
//   openai_identify  { imageBase64, mode }        → { text }
//   vision_category  { imageBase64 }              → { labels: string[] }
//   ai_nearby        { lat, lng }                 → { suggestions: [{commonName, latinName, kingdom}] }
//   field_guide      { commonName, latinName? }   → { guide: {...} | null }
//
// Secrets required: ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_VISION_API_KEY

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'
const CLAUDE_IDENTIFY_MODELS = ['claude-sonnet-4-5-20251001', 'claude-haiku-4-5-20251001'] as const
const CLAUDE_TEXT_MODEL = 'claude-haiku-4-5-20251001'
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions'
const OPENAI_MODEL = 'gpt-4o'
const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

const MAX_IMAGE_BASE64_LENGTH = 8_000_000 // ~6MB decoded; app sends resized JPEGs well below this

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function secret(name: string): string {
  return (Deno.env.get(name) ?? '').trim()
}

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

const WILD_SPECIES_PROMPT = `You are an expert animal and species identifier.
Identify the exact species in this photo — including wild animals, domestic pets (dogs, cats), birds, insects, reptiles, and plants.
Respond ONLY with JSON:
{
  "commonName": "Pembroke Welsh Corgi",
  "latinName": "Canis lupus familiaris",
  "kingdom": "Mammalia",
  "confidence": 0.92,
  "isDomestic": true,
  "isGeneric": false
}
Set isDomestic: true for dogs, cats, and other domestic pets. Set isDomestic: false for wild species.
Set isGeneric: true if you can only identify a general category without a specific species.
Set confidence between 0 and 1.
If you truly cannot identify anything, set commonName to "Unknown" and confidence to 0.`

type IdentifyMode = 'domestic_breed' | 'wild_species'

function identifyPrompts(mode: IdentifyMode): { system: string; user: string } {
  return mode === 'domestic_breed'
    ? { system: DOMESTIC_BREED_PROMPT, user: 'Identify the dog or cat breed in this image.' }
    : { system: WILD_SPECIES_PROMPT, user: 'Identify the species in this image.' }
}

async function claudeIdentify(imageBase64: string, mode: IdentifyMode): Promise<Response> {
  const apiKey = secret('ANTHROPIC_API_KEY')
  if (!apiKey) return json({ error: 'Identification is not configured.', code: 'NO_TOKEN' }, 503)

  const prompts = identifyPrompts(mode)
  let lastMessage = 'Claude vision is unavailable right now.'

  for (const model of CLAUDE_IDENTIFY_MODELS) {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 256,
        system: prompts.system,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 },
              },
              { type: 'text', text: prompts.user },
            ],
          },
        ],
      }),
    })

    const body = (await res.json()) as {
      error?: { message?: string }
      content?: Array<{ type?: string; text?: string }>
    }

    if (!res.ok) {
      lastMessage = body.error?.message ?? `Claude API ${res.status}`
      continue
    }

    const text = body.content?.find((block) => block.type === 'text')?.text
    if (!text) {
      lastMessage = 'Claude returned an empty response.'
      continue
    }

    return json({ text })
  }

  return json({ error: lastMessage, code: 'API' }, 502)
}

async function openAiIdentify(imageBase64: string, mode: IdentifyMode): Promise<Response> {
  const apiKey = secret('OPENAI_API_KEY')
  if (!apiKey) return json({ error: 'Identification is not configured.', code: 'NO_TOKEN' }, 503)

  const prompts = identifyPrompts(mode)
  const res = await fetch(OPENAI_URL, {
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
        { role: 'system', content: prompts.system },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' },
            },
            { type: 'text', text: prompts.user },
          ],
        },
      ],
    }),
  })

  const body = (await res.json()) as {
    error?: { message?: string }
    choices?: Array<{ message?: { content?: string } }>
  }

  if (!res.ok) {
    return json({ error: body.error?.message ?? `OpenAI API ${res.status}`, code: 'API' }, 502)
  }

  const text = body.choices?.[0]?.message?.content
  if (!text) return json({ error: 'OpenAI returned an empty response.', code: 'API' }, 502)

  return json({ text })
}

async function visionCategory(imageBase64: string): Promise<Response> {
  const apiKey = secret('GOOGLE_VISION_API_KEY')
  if (!apiKey) return json({ labels: [] })

  const res = await fetch(`${VISION_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBase64 },
          features: [
            { type: 'LABEL_DETECTION', maxResults: 20 },
            { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
          ],
        },
      ],
    }),
  })

  const body = (await res.json()) as {
    error?: { message?: string }
    responses?: Array<{
      labelAnnotations?: Array<{ description?: string; score?: number }>
      localizedObjectAnnotations?: Array<{ name?: string; score?: number }>
      error?: { message?: string }
    }>
  }
  const block = body.responses?.[0]

  if (!res.ok || block?.error) {
    return json(
      { error: block?.error?.message ?? body.error?.message ?? `Vision API ${res.status}`, code: 'API' },
      502,
    )
  }

  const scored: Array<{ text: string; score: number }> = []
  for (const label of block?.labelAnnotations ?? []) {
    const text = label.description?.trim().toLowerCase()
    if (text) scored.push({ text, score: label.score ?? 0 })
  }
  for (const object of block?.localizedObjectAnnotations ?? []) {
    const text = object.name?.trim().toLowerCase()
    if (text) scored.push({ text, score: object.score ?? 0 })
  }
  scored.sort((a, b) => b.score - a.score)

  return json({ labels: scored.map((entry) => entry.text) })
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const

async function claudeText(prompt: string): Promise<string | null> {
  const apiKey = secret('ANTHROPIC_API_KEY')
  if (!apiKey) return null

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model: CLAUDE_TEXT_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) return null

  const body = (await res.json()) as { content?: Array<{ type?: string; text?: string }> }
  return body.content?.find((b) => b.type === 'text')?.text ?? null
}

async function aiNearby(lat: number, lng: number): Promise<Response> {
  const month = MONTH_NAMES[new Date().getMonth()] ?? 'Unknown'
  const prompt =
    `You are a wildlife expert. For the location at latitude ${lat.toFixed(4)}, longitude ${lng.toFixed(4)} in ${month}, list 6 wild animal species commonly observable by a casual nature enthusiast outdoors.\n` +
    'Respond ONLY with a JSON array, no explanation:\n' +
    '[{"commonName":"Red Fox","latinName":"Vulpes vulpes","kingdom":"mammal"},...]\n' +
    'kingdom must be one of: mammal, bird, reptile, amphibian, fish, insect, arachnid, mollusc.\n' +
    'Only include species that genuinely occur in that region and season.'

  const text = (await claudeText(prompt)) ?? ''
  const start = text.indexOf('[')
  const end = text.lastIndexOf(']')
  if (start < 0 || end <= start) return json({ suggestions: [] })

  try {
    return json({ suggestions: JSON.parse(text.slice(start, end + 1)) })
  } catch {
    return json({ suggestions: [] })
  }
}

async function fieldGuide(commonName: string, latinName?: string | null): Promise<Response> {
  const label = latinName ? `${commonName} (${latinName})` : commonName
  const prompt =
    `You are a wildlife field guide expert. Write a concise field guide entry for ${label}.\n` +
    'Respond ONLY with JSON, no explanation:\n' +
    '{"whatIsIt":"2-3 sentences on appearance, habitat, and behavior.","safetyLevel":"low","safetyNote":"1-2 sentences on safety for observers.","approachTip":"1-2 sentences on getting close for a good photo.","bestTimeToSpot":"1 sentence on ideal time."}\n' +
    'safetyLevel must be "low", "moderate", or "high". Keep each value under 100 words. Tone: warm, naturalist, encouraging.'

  const text = (await claudeText(prompt)) ?? ''
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return json({ guide: null })

  try {
    return json({ guide: JSON.parse(text.slice(start, end + 1)) })
  } catch {
    return json({ guide: null })
  }
}

function readImage(body: Record<string, unknown>): string | null {
  const image = body.imageBase64
  if (typeof image !== 'string' || image.length === 0) return null
  if (image.length > MAX_IMAGE_BASE64_LENGTH) return null
  return image
}

function readMode(body: Record<string, unknown>): IdentifyMode {
  return body.mode === 'domestic_breed' ? 'domestic_breed' : 'wild_species'
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  try {
    switch (body.action) {
      case 'claude_identify': {
        const image = readImage(body)
        if (!image) return json({ error: 'imageBase64 is required', code: 'API' }, 400)
        return await claudeIdentify(image, readMode(body))
      }
      case 'openai_identify': {
        const image = readImage(body)
        if (!image) return json({ error: 'imageBase64 is required', code: 'API' }, 400)
        return await openAiIdentify(image, readMode(body))
      }
      case 'vision_category': {
        const image = readImage(body)
        if (!image) return json({ error: 'imageBase64 is required', code: 'API' }, 400)
        return await visionCategory(image)
      }
      case 'ai_nearby': {
        const lat = Number(body.lat)
        const lng = Number(body.lng)
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
          return json({ error: 'lat and lng are required', code: 'API' }, 400)
        }
        return await aiNearby(lat, lng)
      }
      case 'field_guide': {
        const commonName = typeof body.commonName === 'string' ? body.commonName.trim() : ''
        if (!commonName) return json({ error: 'commonName is required', code: 'API' }, 400)
        const latinName = typeof body.latinName === 'string' ? body.latinName : null
        return await fieldGuide(commonName, latinName)
      }
      default:
        return json({ error: 'Unknown action' }, 400)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error'
    return json({ error: message, code: 'API' }, 500)
  }
})
