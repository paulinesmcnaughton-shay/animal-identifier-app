import { isGenericAnimalName } from '@/features/identify/generic-animal-name'
import type { IdentResult } from '@/features/identify/types'

export const DOMESTIC_MIXED_BREED_DOG = 'Mixed Breed Dog'
export const DOMESTIC_MIXED_BREED_CAT = 'Mixed Breed Cat'
export const DOMESTIC_DEX_DOG = 'D001'
export const DOMESTIC_DEX_CAT = 'D051'

const PET_RETAIL_LABEL =
  /\b(pet supply|pet supplies|pet food|dog food|cat food|animal product|pet store|pet care|pet accessory)\b/i

export type DomesticPetKind = 'dog' | 'cat'

export function isGenericPetRetailLabel(label: string): boolean {
  return PET_RETAIL_LABEL.test(label.trim())
}

export function needsBreedRefinement(commonName: string, extraLabels: string[] = []): boolean {
  const labels = [commonName, ...extraLabels]
  if (labels.some((l) => isGenericPetRetailLabel(l))) return true
  if (isGenericAnimalName(commonName)) return true
  const lower = commonName.trim().toLowerCase()
  if (/^(dog|cat|pet|puppy|kitten|mammal|animal)$/.test(lower)) return true
  if (/^domestic (dog|cat)$/.test(lower)) return true
  return false
}

export function inferPetKindFromLabels(...labels: string[]): DomesticPetKind | null {
  const text = labels.join(' ').toLowerCase()
  const cat = /\b(cat|feline|kitten|tabby|siamese|persian|ragdoll|sphynx|bengal|maine coon)\b/.test(text)
  const dog = /\b(dog|canine|puppy|corgi|retriever|shepherd|terrier|poodle|husky|beagle|bulldog|labrador|collie|dachshund|chihuahua)\b/.test(
    text,
  )
  if (cat && !dog) return 'cat'
  if (dog && !cat) return 'dog'
  return null
}

export function mixedBreedIdentResult(kind: DomesticPetKind, confidence: number): IdentResult {
  return {
    commonName: kind === 'cat' ? DOMESTIC_MIXED_BREED_CAT : DOMESTIC_MIXED_BREED_DOG,
    kingdom: 'mammal',
    confidence: Math.max(confidence, 0.35),
    source: 'claude',
    isDomestic: true,
    dexNumber: kind === 'cat' ? DOMESTIC_DEX_CAT : DOMESTIC_DEX_DOG,
  }
}

export function resolveDomesticMixedBreedFallback(
  primaryLabel: string,
  extraLabels: string[],
  confidence: number,
): IdentResult {
  const kind = inferPetKindFromLabels(primaryLabel, ...extraLabels) ?? 'dog'
  return mixedBreedIdentResult(kind, confidence)
}
