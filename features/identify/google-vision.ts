import Constants from 'expo-constants'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'

import { readImageBase64 } from './read-image-base64'
import { type IdentResult, IdentifyError } from './types'

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

const GENERIC_NAMES =
  /^(dog|cat|mammal|pet|animal|canine|feline|puppy|kitten|domestic dog|domestic cat|dog breed|cat breed)$/i

const ANIMAL_PLANT_LABEL =
  /\b(animal|mammal|bird|fish|insect|butterfly|bee|spider|reptile|snake|lizard|frog|mollusc|snail|dog|cat|pet|canine|feline|puppy|kitten|rabbit|bunny|hare|hamster|gerbil|guinea pig|chinchilla|ferret|rodent|mouse|rat|parrot|parakeet|budgie|cockatiel|canary|corgi|retriever|shepherd|terrier|poodle|husky|beagle|bulldog|labrador|collie|dachshund|chihuahua|siamese|persian|ragdoll|tabby|sphynx|bengal|maine coon|shorthair|plant|flower|tree|shrub|herb|grass|leaf|succulent|palm|fern|fauna|flora)\b/i

const BREED_HINT =
  /\b(corgi|pembroke|cardigan|welsh corgi|retriever|shepherd|terrier|poodle|husky|beagle|bulldog|labrador|collie|dachshund|chihuahua|pomeranian|maltese|spaniel|whippet|greyhound|siamese|persian|ragdoll|tabby|sphynx|bengal|birman|burmese|abyssinian|shorthair|longhair|maine coon|british|scottish fold|holland lop|netherland dwarf|syrian hamster|dwarf hamster|guinea pig|cockatiel|parakeet|mix)\b/i

const VAGUE_GROUP_LABEL =
  /\b(ancient dog|toy dog|sporting dog|working dog|herding dog|hound group|dog breeds?|breed group|companion dog|gun dog|non-?sporting|types of dog)\b/i

const LABEL_KINGDOM: Array<{ pattern: RegExp; kingdom: KingdomKey }> = [
  { pattern: /\b(plant|flower|tree|shrub|herb|grass|leaf|foliage|succulent|palm|fern|moss|flora|rose|tulip|daisy)\b/i, kingdom: 'plant' },
  { pattern: /\b(bird|owl|eagle|sparrow|duck|goose|hawk|finch|crow|raven|feather)\b/i, kingdom: 'bird' },
  { pattern: /\b(fish|salmon|trout|shark)\b/i, kingdom: 'fish' },
  { pattern: /\b(insect|butterfly|moth|bee|wasp|beetle|dragonfly|ant)\b/i, kingdom: 'insect' },
  { pattern: /\b(spider|arachnid|scorpion)\b/i, kingdom: 'arachnid' },
  { pattern: /\b(snail|slug|mollusc|clam|octopus)\b/i, kingdom: 'mollusc' },
  { pattern: /\b(snake|lizard|turtle|tortoise|reptile|crocodile|alligator)\b/i, kingdom: 'reptile' },
  { pattern: /\b(frog|toad|salamander|amphibian)\b/i, kingdom: 'amphibian' },
  { pattern: /\b(dog|cat|mammal|pet|canine|feline|horse|deer|fox|bear|rabbit|bunny|hare|hamster|gerbil|guinea pig|chinchilla|ferret|rodent|mouse|rat|corgi|puppy|cow|retriever|shepherd|terrier|poodle|husky|siamese|persian)\b/i, kingdom: 'mammal' },
  { pattern: /\b(parrot|parakeet|budgie|cockatiel|canary|finch|lovebird)\b/i, kingdom: 'bird' },
]

interface VisionLabel {
  description: string
  score: number
}

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.googleVisionApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

function getIosBundleId(): string | undefined {
  const id = Constants.expoConfig?.ios?.bundleIdentifier
  return typeof id === 'string' && id.length > 0 ? id : undefined
}

export function isGenericAnimalName(name: string): boolean {
  const trimmed = name.trim()
  if (GENERIC_NAMES.test(trimmed)) return true
  if (/^domestic /i.test(trimmed) && trimmed.split(/\s+/).length <= 2) return true
  return false
}

function kingdomFromLabel(description: string): KingdomKey | null {
  for (const { pattern, kingdom } of LABEL_KINGDOM) {
    if (pattern.test(description)) return kingdom
  }
  return null
}

function titleCase(label: string): string {
  return label
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

function rankLabel(description: string, apiScore: number): number {
  const lower = description.toLowerCase().trim()
  if (GENERIC_NAMES.test(lower)) return apiScore * 0.2
  if (VAGUE_GROUP_LABEL.test(lower)) return apiScore * 0.15
  let rank = apiScore
  const words = lower.split(/\s+/).length
  rank += words * 0.15
  if (BREED_HINT.test(lower)) rank += 0.65
  if (/\b(welsh|pembroke|cardigan)\b/i.test(lower) && /\bcorgi\b/i.test(lower)) rank += 0.35
  if (/\b(breed|mix|purebred)\b/i.test(lower) && !VAGUE_GROUP_LABEL.test(lower)) rank += 0.08
  return rank
}

function pickBestLabel(
  rows: Array<{ description?: string; score?: number }>,
): VisionLabel | null {
  const candidates: VisionLabel[] = []

  for (const row of rows) {
    const description = row.description?.trim()
    if (!description || !ANIMAL_PLANT_LABEL.test(description)) continue
    const kingdom = kingdomFromLabel(description)
    if (!kingdom) continue
    candidates.push({
      description,
      score: typeof row.score === 'number' ? row.score : 0.5,
    })
  }

  if (candidates.length === 0) return null

  candidates.sort(
    (a, b) => rankLabel(b.description, b.score) - rankLabel(a.description, a.score),
  )
  return candidates[0] ?? null
}

export function canUseGoogleVision(): boolean {
  return getApiKey().length > 0
}

export async function scoreImageWithGoogleVision(uri: string): Promise<IdentResult> {
  const apiKey = getApiKey()
  if (!apiKey) {
    throw new IdentifyError(
      'Add GOOGLE_VISION_API_KEY to .env for dogs, cats, and other pets.',
      'NO_TOKEN',
    )
  }

  const base64 = await readImageBase64(uri)

  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  const bundleId = getIosBundleId()
  if (bundleId) headers['X-Ios-Bundle-Identifier'] = bundleId

  let res: Response
  try {
    res = await fetch(`${VISION_URL}?key=${apiKey}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [{ type: 'LABEL_DETECTION', maxResults: 20 }],
          },
        ],
      }),
    })
  } catch {
    throw new IdentifyError('Network error — check Wi‑Fi and try again.', 'NETWORK')
  }

  const json = (await res.json()) as {
    error?: { message?: string; status?: string }
    responses?: Array<{
      labelAnnotations?: Array<{ description?: string; score?: number }>
      error?: { message?: string }
    }>
  }

  if (!res.ok) {
    const msg =
      json.error?.message ??
      json.responses?.[0]?.error?.message ??
      `Vision API ${res.status}`
    throw new IdentifyError(msg, 'API')
  }

  const match = pickBestLabel(json.responses?.[0]?.labelAnnotations ?? [])
  if (!match) {
    throw new IdentifyError(
      'No animal or plant found — try a clearer photo of a creature or plant.',
      'NOT_LIVING',
    )
  }

  const kingdom = kingdomFromLabel(match.description)
  if (!kingdom) {
    throw new IdentifyError(
      'No animal or plant found — try a clearer photo of a creature or plant.',
      'NOT_LIVING',
    )
  }

  return {
    commonName: titleCase(match.description),
    kingdom,
    confidence: match.score,
    source: 'google',
  }
}
