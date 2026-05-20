import Constants from 'expo-constants'

import { readImageBase64 } from './read-image-base64'
import type { PipelineCategory } from './types'
import { IdentifyError } from './types'

const VISION_URL = 'https://vision.googleapis.com/v1/images:annotate'

interface VisionLabel {
  description?: string
  score?: number
}

interface VisionLocalizedObject {
  name?: string
  score?: number
}

interface VisionResponseBlock {
  labelAnnotations?: VisionLabel[]
  localizedObjectAnnotations?: VisionLocalizedObject[]
  error?: { message?: string }
}

interface VisionAnnotateResponse {
  responses?: VisionResponseBlock[]
  error?: { message?: string }
}

export interface GoogleCategoryScan {
  category: PipelineCategory
  topLabels: string[]
}

function getApiKey(): string {
  const key = Constants.expoConfig?.extra?.googleVisionApiKey
  if (typeof key !== 'string') return ''
  return key.replace(/\s/g, '').trim()
}

export function canUseGoogleVision(): boolean {
  return getApiKey().length > 0
}

function collectLabelTexts(block: VisionResponseBlock | undefined): string[] {
  if (!block) return []

  const scored: Array<{ text: string; score: number }> = []

  for (const label of block.labelAnnotations ?? []) {
    const text = label.description?.trim().toLowerCase()
    if (!text) continue
    scored.push({ text, score: label.score ?? 0 })
  }

  for (const object of block.localizedObjectAnnotations ?? []) {
    const text = object.name?.trim().toLowerCase()
    if (!text) continue
    scored.push({ text, score: object.score ?? 0 })
  }

  scored.sort((a, b) => b.score - a.score)
  return scored.map((entry) => entry.text)
}

export function mapLabelsToPipelineCategory(labels: string[]): PipelineCategory {
  if (labels.length === 0) return 'unknown'

  const text = labels.join(' ')

  if (
    /\b(dog|canine|puppy|hound|corgi|retriever|shepherd|terrier|poodle|husky|beagle|bulldog|labrador|collie|dachshund|chihuahua|pug|spaniel|mutt)\b/.test(
      text,
    )
  ) {
    return 'domestic_dog'
  }
  if (/\b(cat|kitten|feline)\b/.test(text) && !/\bcaterpillar\b/.test(text)) return 'domestic_cat'
  if (/\b(bird|avian|fowl)\b/.test(text)) return 'bird'
  if (/\b(insect|butterfly|beetle|bee|ant|dragonfly|moth|wasp|arthropod)\b/.test(text)) {
    return 'insect'
  }
  if (/\b(reptile|lizard|snake|turtle|tortoise|gecko|alligator|crocodile)\b/.test(text)) {
    return 'reptile'
  }
  if (
    /\b(plant|flower|tree|fungi|mushroom|foliage|leaf|grass|herb|shrub|bouquet|floral|floristry|cut flowers|flower arrangement|garden roses|rose|tulip|daisy|sunflower|lily|orchid|peony|carnation|daffodil|hydrangea|lavender|poppy|wildflower)\b/.test(
      text,
    )
  ) {
    return 'plant'
  }
  if (/\b(mammal|wildlife)\b/.test(text) && !/\b(dog|cat|puppy|kitten|pet)\b/.test(text)) {
    return 'wild_mammal'
  }
  if (/\b(animal|fauna)\b/.test(text) && !/\b(dog|cat|puppy|kitten|pet)\b/.test(text)) {
    return 'wild_mammal'
  }

  return 'unknown'
}

export async function detectImageCategory(uri: string): Promise<GoogleCategoryScan> {
  const apiKey = getApiKey()
  if (!apiKey) {
    return { category: 'unknown', topLabels: [] }
  }

  const base64 = await readImageBase64(uri)

  let res: Response
  try {
    res = await fetch(`${VISION_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
            ],
          },
        ],
      }),
    })
  } catch {
    throw new IdentifyError('Network error — check Wi‑Fi and try again.', 'NETWORK')
  }

  const json = (await res.json()) as VisionAnnotateResponse
  const block = json.responses?.[0]

  if (!res.ok || block?.error) {
    throw new IdentifyError(
      block?.error?.message ?? json.error?.message ?? `Vision API ${res.status}`,
      'API',
    )
  }

  const topLabels = collectLabelTexts(block)
  const category = mapLabelsToPipelineCategory(topLabels)

  return { category, topLabels }
}
