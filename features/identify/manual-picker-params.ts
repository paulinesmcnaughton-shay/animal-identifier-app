import type { PipelineCategory } from '@/features/identify/types'
import type { PickerKingdomFilter } from '@/features/species/picker-kingdom-tabs'

export function pipelineCategoryToPickerFilter(category: PipelineCategory | undefined): PickerKingdomFilter {
  switch (category) {
    case 'domestic_dog':
    case 'domestic_cat':
    case 'wild_mammal':
      return 'mammal'
    case 'bird':
      return 'bird'
    case 'insect':
      return 'insect'
    case 'reptile':
      return 'reptile'
    case 'plant':
      return 'plant'
    default:
      return 'all'
  }
}

const PIPELINE_CATEGORIES = new Set<PipelineCategory>([
  'domestic_dog',
  'domestic_cat',
  'bird',
  'insect',
  'reptile',
  'plant',
  'wild_mammal',
  'unknown',
])

export function parsePipelineCategory(value: string | undefined): PipelineCategory | undefined {
  if (!value) return undefined
  return PIPELINE_CATEGORIES.has(value as PipelineCategory) ? (value as PipelineCategory) : undefined
}

export function buildManualPickerRouteParams(outcome: {
  uri: string
  category?: PipelineCategory
  hintCommonName?: string
  hintKingdom?: string
}): Record<string, string> {
  const params: Record<string, string> = { uri: outcome.uri }
  if (outcome.category) params.category = outcome.category
  if (outcome.hintCommonName) params.hintName = outcome.hintCommonName
  if (outcome.hintKingdom) params.hintKingdom = outcome.hintKingdom
  return params
}
