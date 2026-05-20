import { slugifySpeciesName } from '@/data/species-catalog'

const RED_FOX_HERO = require('@/assets/images/red-fox-hero.jpg')

const LOCAL_HERO_BY_KEY: Record<string, number> = {
  '1': RED_FOX_HERO,
  fox: RED_FOX_HERO,
  'red-fox': RED_FOX_HERO,
  gecko: require('@/assets/images/crested_gecko_faq.webp'),
  'crested-gecko': require('@/assets/images/crested_gecko_faq.webp'),
}

export function getLocalSpeciesHeroImage(lookupKey: string): number | null {
  const trimmed = lookupKey.trim()
  if (!trimmed) return null

  const lower = trimmed.toLowerCase()
  const slug = slugifySpeciesName(trimmed)

  return LOCAL_HERO_BY_KEY[lower] ?? LOCAL_HERO_BY_KEY[slug] ?? null
}
