export type CollectorTier = 'bronze' | 'silver' | 'gold'

export const COLLECTOR_TIER_THRESHOLDS = {
  bronze: { min: 0, max: 50 },
  silver: { min: 51, max: 150 },
  gold: { min: 151, max: 300 },
} as const

export function tierForCaptureCount(count: number): CollectorTier {
  if (count >= COLLECTOR_TIER_THRESHOLDS.gold.min) return 'gold'
  if (count >= COLLECTOR_TIER_THRESHOLDS.silver.min) return 'silver'
  return 'bronze'
}

const TIER_BADGE_IMAGES = {
  bronze: require('@/assets/images/bronze-badge.png'),
  silver: require('@/assets/images/silver-badge.png'),
  gold: require('@/assets/images/gold-badge.png'),
} as const

export function badgeImageForTier(tier: CollectorTier): number {
  return TIER_BADGE_IMAGES[tier]
}
