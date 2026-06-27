import type { Badge } from '@/data/badges'

export interface BadgeStats {
  spotsCaptured: number
  streakDays: number
  /** Distinct collected species per kingdom key (mammal, bird, tree, …). */
  kingdomCounts: Record<string, number>
  /** Total distinct species in the Wild Dex. */
  distinctSpecies: number
  /** Distinct species by collection/category. */
  domesticCount: number
  wildCount: number
  farmCount: number
  /** Lowercased common + scientific names of every collected species. */
  speciesNames: string[]
  /** Number of sightings that have a photo. */
  photoCount: number
  /** Whether any capture happened in each window. */
  hasEarlyBird: boolean
  hasMorning: boolean
  hasNight: boolean
  hasWeekend: boolean
  hasAutumn: boolean
  /** Habitat tags seen across all sightings (forest, beach, out-of-state, …). */
  habitats: Set<string>
}

// Places badge → the habitat tag that unlocks it (set when a sighting is geocoded).
const HABITAT_BY_BADGE: Record<string, string> = {
  'First Forest Sighting': 'forest',
  'First Beach Sighting': 'beach',
  'First River Sighting': 'river',
  'First Lake Sighting': 'lake',
  'First Mountain Sighting': 'mountain',
  'First Park Sighting': 'park',
  'First Trail Sighting': 'trail',
  'First Backyard Sighting': 'backyard',
  'First Farm Sighting': 'farm',
  'First Zoo Sighting': 'zoo',
  'First International Sighting': 'international',
  'First Out-of-State Sighting': 'out-of-state',
}

// Badge label (singular or plural) → kingdom key used on sightings.
const KINGDOM_BY_LABEL: Record<string, string> = {
  Mammal: 'mammal',
  Mammals: 'mammal',
  Bird: 'bird',
  Birds: 'bird',
  Fish: 'fish',
  Reptile: 'reptile',
  Reptiles: 'reptile',
  Amphibian: 'amphibian',
  Amphibians: 'amphibian',
  Insect: 'insect',
  Insects: 'insect',
  Arachnid: 'arachnid',
  Plant: 'plant',
  Plants: 'plant',
  Tree: 'tree',
  Trees: 'tree',
  Flower: 'flower',
  Flowers: 'flower',
}

// Distinct-species thresholds. Tunable game-design numbers.
const DISTINCT_TIERS: Record<string, number> = {
  'New Species Found': 1,
  'Curious Explorer': 5,
  'Starter Collection': 10,
  'Mini Naturalist': 10,
  'Growing Collection': 25,
  'Big Collection': 50,
  'Family Collection': 100,
  'Nature Collector': 150,
  'Dex Builder': 200,
}

// Themed badges → distinct species in the given kingdom(s) ≥ min.
const KINGDOM_PROXY: Record<string, { kingdoms: string[]; min: number }> = {
  'Feather Finder': { kingdoms: ['bird'], min: 1 },
  'Sky Watcher': { kingdoms: ['bird'], min: 10 },
  'Water Watcher': { kingdoms: ['fish'], min: 10 },
  'First Bloom': { kingdoms: ['flower'], min: 1 },
  'First Wildflower': { kingdoms: ['flower'], min: 1 },
  'Wildflower Finder': { kingdoms: ['flower'], min: 10 },
  'Garden Explorer': { kingdoms: ['flower'], min: 10 },
  'Bloom Collector': { kingdoms: ['flower'], min: 10 },
  'Pollinator Pal': { kingdoms: ['insect'], min: 10 },
  'Tiny Creature': { kingdoms: ['insect', 'arachnid'], min: 1 },
  'Shell Spotter': { kingdoms: ['mollusc'], min: 1 },
  'Forest Explorer': { kingdoms: ['tree'], min: 10 },
  'Native Tree Scout': { kingdoms: ['tree'], min: 10 },
  'Canopy Collector': { kingdoms: ['tree'], min: 10 },
  'Big Creature': { kingdoms: ['mammal'], min: 10 },
  'First Leafy Plant': { kingdoms: ['plant'], min: 1 },
  'First Garden Flower': { kingdoms: ['flower'], min: 1 },
}

// Species whose name marks them as a rare find — shared with the Rare Find quest.
export const RARE_SPECIES_KEYWORDS = ['tiger', 'panda', 'rhino', 'gorilla', 'orangutan', 'snow leopard', 'leopard', 'cheetah', 'jaguar', 'elephant', 'axolotl', 'kakapo', 'condor', 'koala', 'sloth', 'pangolin', 'okapi', 'tapir', 'red panda', 'lynx', 'wolverine', 'manatee', 'dugong', 'quetzal', 'kiwi', 'platypus', 'tasmanian', 'bonobo', 'gibbon', 'vaquita', 'saola'] as const

// Nocturnal species by name — shared with the Dusk quest.
export const NOCTURNAL_SPECIES_KEYWORDS = ['owl', 'bat', 'raccoon', 'opossum', 'possum', 'moth', 'firefly', 'hedgehog', 'badger', 'coyote', 'tarsier', 'aye-aye', 'lemur', 'flying squirrel', 'nightjar', 'gecko', 'ocelot', 'kinkajou', 'sugar glider', 'wombat', 'armadillo'] as const

// Sub-type badges → earned if any collected species name contains a keyword.
const NAME_KEYWORDS: Record<string, string[]> = {
  'First Pine': ['pine', 'pinus'],
  'First Oak': ['oak', 'quercus'],
  'First Maple': ['maple', 'acer'],
  'First Palm': ['palm', 'arecaceae'],
  'First Fern': ['fern'],
  'First Moss': ['moss'],
  'First Vine': ['vine'],
  'First Succulent': ['succulent', 'cactus', 'cacti', 'aloe', 'agave', 'echeveria'],
  'First Grass': ['grass'],
  'First Evergreen': ['pine', 'spruce', 'fir', 'cedar', 'cypress', 'conifer', 'evergreen'],
  'First Deciduous': ['maple', 'oak', 'birch', 'elm', 'aspen', 'willow', 'beech'],
  'First Fruit Tree': ['apple', 'cherry', 'orange', 'lemon', 'lime', 'peach', 'pear', 'fig', 'plum', 'citrus', 'mango', 'avocado'],
  'Acorn Scout': ['oak', 'quercus'],
  'Pinecone Finder': ['pine', 'pinus', 'spruce', 'fir', 'conifer'],
  'Ancient Tree': ['sequoia', 'redwood', 'bristlecone', 'cypress', 'cedar', 'baobab', 'ginkgo', 'oak'],
  'First Marine Animal': ['dolphin', 'whale', 'shark', 'octopus', 'seal', 'sea lion', 'penguin', 'jellyfish', 'coral', 'manta', 'stingray', ' ray', 'manatee', 'orca', 'walrus', 'lobster', 'starfish', 'sea star', 'anemone', 'tuna', 'marlin', 'seahorse', 'clownfish', 'squid', 'urchin', 'sea turtle', 'narwhal', 'swordfish'],
  'First Nocturnal Animal': [...NOCTURNAL_SPECIES_KEYWORDS],
  'Camouflage Finder': ['chameleon', 'stick insect', 'walking stick', 'leaf insect', 'katydid', 'octopus', 'cuttlefish', 'flounder', 'stonefish', 'mantis', 'seahorse', 'leaf-tailed', 'stick bug', 'peppered moth', 'dead leaf', 'flatfish'],
  'Rare Species': [...RARE_SPECIES_KEYWORDS],
}

/**
 * Whether a badge is earned from real progress. Intentionally LEFT LOCKED (no signal
 * exists yet): habitat firsts (no biome data), care/ethics badges (no behaviour
 * tracking), weather (Rainy Day), rarity (Rare Species/Bloom), Marine/Nocturnal,
 * Camouflage Finder, and a few ambiguous plant types.
 */
export function isBadgeEarned(name: string, stats: BadgeStats): boolean {
  const sightings = /^(\d+) Sightings$/.exec(name)
  if (sightings) return stats.spotsCaptured >= Number(sightings[1])
  if (name === 'First Sighting') return stats.spotsCaptured >= 1

  const streak = /^(\d+) Day Streak$/.exec(name)
  if (streak) return stats.streakDays >= Number(streak[1])

  const kingdomCount =
    /^(\d+) (Mammals|Birds|Fish|Reptiles|Amphibians|Insects|Plants|Trees|Flowers)$/.exec(name)
  if (kingdomCount) {
    return (stats.kingdomCounts[KINGDOM_BY_LABEL[kingdomCount[2]]] ?? 0) >= Number(kingdomCount[1])
  }

  const firstOfKingdom =
    /^First (Mammal|Bird|Fish|Reptile|Amphibian|Insect|Arachnid|Plant|Tree|Flower)$/.exec(name)
  if (firstOfKingdom) {
    return (stats.kingdomCounts[KINGDOM_BY_LABEL[firstOfKingdom[1]]] ?? 0) >= 1
  }

  const domestic = /^(\d+) Domestic Animals$/.exec(name)
  if (domestic) return stats.domesticCount >= Number(domestic[1])
  if (name === 'First Domestic Animal') return stats.domesticCount >= 1

  const farm = /^(\d+) Farm Animals$/.exec(name)
  if (farm) return stats.farmCount >= Number(farm[1])
  if (name === 'First Farm Animal') return stats.farmCount >= 1

  if (name === 'First Wild Animal') return stats.wildCount >= 1
  if (name === 'First Mushroom') return (stats.kingdomCounts.fungi ?? 0) >= 1

  const tier = DISTINCT_TIERS[name]
  if (tier !== undefined) return stats.distinctSpecies >= tier

  const proxy = KINGDOM_PROXY[name]
  if (proxy) {
    const total = proxy.kingdoms.reduce((sum, k) => sum + (stats.kingdomCounts[k] ?? 0), 0)
    return total >= proxy.min
  }

  const keywords = NAME_KEYWORDS[name]
  if (keywords) return stats.speciesNames.some((n) => keywords.some((k) => n.includes(k)))

  if (name === 'Early Bird') return stats.hasEarlyBird
  if (name === 'Morning Explorer') return stats.hasMorning
  if (name === 'Night Explorer') return stats.hasNight
  if (name === 'Weekend Explorer') return stats.hasWeekend
  if (name === 'Autumn Watcher') return stats.hasAutumn
  if (name === 'Photo Journaler') return stats.photoCount >= 50

  const habitat = HABITAT_BY_BADGE[name]
  if (habitat) return stats.habitats.has(habitat)

  return false
}

export function earnedBadgeIds(badges: Badge[], stats: BadgeStats): Set<string> {
  const earned = new Set<string>()
  for (const b of badges) if (isBadgeEarned(b.name, stats)) earned.add(b.id)
  return earned
}
