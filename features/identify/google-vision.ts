import { canUseAiGateway, invokeAiGateway } from './ai-gateway'
import { readImageBase64 } from './read-image-base64'
import type { PipelineCategory } from './types'

export interface GoogleCategoryScan {
  category: PipelineCategory
  topLabels: string[]
}

export function canUseGoogleVision(): boolean {
  return canUseAiGateway()
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
  if (!canUseAiGateway()) {
    return { category: 'unknown', topLabels: [] }
  }

  const base64 = await readImageBase64(uri)
  const { labels } = await invokeAiGateway<{ labels?: string[] }>({
    action: 'vision_category',
    imageBase64: base64,
  })

  const topLabels = Array.isArray(labels)
    ? labels.filter((label): label is string => typeof label === 'string')
    : []
  const category = mapLabelsToPipelineCategory(topLabels)

  return { category, topLabels }
}
