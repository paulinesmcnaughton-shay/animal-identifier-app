import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import type { NearbyMapSighting } from '@/features/map/map-sighting'

export type NearbySafetyLevel = 'low' | 'moderate' | 'high'

export interface NearbyFieldGuide {
  whatIsIt: string
  safetyLevel: NearbySafetyLevel
  safetyNote: string
  approachTip: string
  bestTimeToSpot: string
}

const NA = 'N/A'

const BY_SLUG: Record<string, NearbyFieldGuide> = {
  fox: {
    whatIsIt:
      'A medium-sized wild canid with a bushy tail and reddish coat. Often seen at dawn and dusk along woodland edges and suburban greenbelts.',
    safetyLevel: 'moderate',
    safetyNote:
      'Usually shy, but never feed or corner a fox. Rabies is rare yet possible — keep pets leashed and give space if it seems sick or unusually bold.',
    approachTip:
      'Stay 50–100 ft (15–30 m) back, downwind if you can. Use a zoom lens or phone telephoto; sudden moves or chasing will make it leave.',
    bestTimeToSpot: 'Dawn and dusk, especially spring when kits may be near dens.',
  },
  'red-fox': {
    whatIsIt:
      'A medium-sized wild canid with a bushy tail and reddish coat. Often seen at dawn and dusk along woodland edges and suburban greenbelts.',
    safetyLevel: 'moderate',
    safetyNote:
      'Usually shy, but never feed or corner a fox. Rabies is rare yet possible — keep pets leashed and give space if it seems sick or unusually bold.',
    approachTip:
      'Stay 50–100 ft (15–30 m) back, downwind if you can. Use a zoom lens or phone telephoto; sudden moves or chasing will make it leave.',
    bestTimeToSpot: 'Dawn and dusk, especially spring when kits may be near dens.',
  },
  monarch: {
    whatIsIt:
      'Large orange-and-black butterfly famous for long-distance migration. Adults nectar on flowers; caterpillars need milkweed.',
    safetyLevel: 'low',
    safetyNote: 'Harmless to people. Avoid touching wings — oils from your skin can damage scales.',
    approachTip:
      'Move slowly within 3–6 ft (1–2 m). Photograph side-on on a still flower; midday sun can make them restless.',
    bestTimeToSpot: 'Late morning on calm, sunny days when milkweed or butterfly bush is blooming.',
  },
  robin: {
    whatIsIt:
      'Common songbird with a warm orange breast. Ground-forages for worms and berries, often on lawns and paths after rain.',
    safetyLevel: 'low',
    safetyNote: 'Not dangerous. Nesting birds may dive nearby if you get too close to a nest — step back.',
    approachTip:
      'Stay 15–20 ft (5–6 m) away and crouch slowly. Short bursts on burst mode work better than chasing.',
    bestTimeToSpot: 'Early morning and after rain when worms are near the surface.',
  },
  cardinal: {
    whatIsIt:
      'Bright red male (duller female) seed-eating songbird. Stays low in shrubs and at feeders with cover nearby.',
    safetyLevel: 'low',
    safetyNote: 'Safe to observe from a distance. Do not disturb dense shrubs that may hide a nest.',
    approachTip:
      'Use a feeder or quiet edge of cover; stay still 10+ ft (3 m) back with a zoom lens.',
    bestTimeToSpot: 'Morning and late afternoon, year-round where feeders or berry bushes exist.',
  },
  owl: {
    whatIsIt:
      'Nocturnal raptor adapted for silent flight and night hunting. Daytime sightings are often roosting birds in trees.',
    safetyLevel: 'moderate',
    safetyNote:
      'Talons are powerful. Never approach a grounded or injured owl — contact a licensed wildlife rehabilitator.',
    approachTip:
      'Observe from afar with binoculars; avoid flash at night. If roosting, keep quiet and use long zoom only.',
    bestTimeToSpot: 'Dusk and night for activity; winter afternoons sometimes reveal roosts.',
  },
  frog: {
    whatIsIt:
      'Amphibian tied to wet habitats. Many species call loudly near ponds after rain.',
    safetyLevel: 'low',
    safetyNote:
      'Most are harmless. Wash hands after handling and never eat unknown frogs/toads — some skin toxins exist in certain species.',
    approachTip:
      'Stay at the pond edge; use a low angle and macro from 2–3 ft (0.5–1 m) without stepping into water.',
    bestTimeToSpot: 'Warm, humid evenings after rain, especially spring breeding season.',
  },
  beetle: {
    whatIsIt: 'Hard-shelled insect; many species visit flowers, logs, or lights at night.',
    safetyLevel: 'low',
    safetyNote: 'Generally harmless. Some large beetles can pinch — let them be.',
    approachTip: 'Photograph on a leaf or log at close range with good light; avoid casting a shadow over the subject.',
    bestTimeToSpot: 'Warm evenings near outdoor lights or sunny afternoon on flowers.',
  },
  gecko: {
    whatIsIt:
      'Small climbing lizard, often on walls or plants in warm climates. Nocturnal species are common around porch lights.',
    safetyLevel: 'low',
    safetyNote: 'Not dangerous to people. Wild geckos should not be handled roughly.',
    approachTip: 'Approach slowly from the side; macro photo from 1–2 ft (0.3–0.6 m) without blocking their escape route.',
    bestTimeToSpot: 'Dusk and night near lights, or warm afternoons in shaded foliage.',
  },
  spider: {
    whatIsIt: 'Eight-legged arachnid; most species are shy predators of insects.',
    safetyLevel: 'moderate',
    safetyNote:
      'Assume venom until identified. Do not handle; give space to widows, recluses, or large orb-weavers in webs.',
    approachTip: 'Photograph web or ground spider from 2–3 ft (0.5–1 m) with flash off when possible.',
    bestTimeToSpot: 'Early morning for dew on webs; night for active hunters near lights.',
  },
  badger: {
    whatIsIt:
      'Stocky, nocturnal burrowing mammal with distinctive facial stripes. Rare daytime views near setts.',
    safetyLevel: 'high',
    safetyNote:
      'Can bite severely if threatened. Never approach a sett or a badger on a path — keep dogs away.',
    approachTip:
      'Only observe from a vehicle or 100+ ft (30 m) with binoculars. Never block escape to a burrow.',
    bestTimeToSpot: 'Dusk and night near meadows, woodland edges, and known setts.',
  },
  'european-badger': {
    whatIsIt:
      'Stocky, nocturnal burrowing mammal with distinctive facial stripes. Rare daytime views near setts.',
    safetyLevel: 'high',
    safetyNote:
      'Can bite severely if threatened. Never approach a sett or a badger on a path — keep dogs away.',
    approachTip:
      'Only observe from a vehicle or 100+ ft (30 m) with binoculars. Never block escape to a burrow.',
    bestTimeToSpot: 'Dusk and night near meadows, woodland edges, and known setts.',
  },
  'blue-jay': {
    whatIsIt:
      'Bold blue corvid that visits oak woods and feeders. Loud calls and intelligent foraging behavior.',
    safetyLevel: 'low',
    safetyNote: 'Not dangerous; may swoop if nesting nearby — give trees a wide berth in spring.',
    approachTip: 'Stay 15 ft (5 m) back at feeders; photograph through a window if possible to reduce startle.',
    bestTimeToSpot: 'Morning at feeders; acorn season in fall in oak habitat.',
  },
  'brown-hare': {
    whatIsIt:
      'Long-eared, long-legged mammal of open fields. Famous for boxing behavior in spring.',
    safetyLevel: 'moderate',
    safetyNote: 'Wild hares stress easily and kick hard if grabbed. Never chase or corner.',
    approachTip:
      'Use a car as a blind or stay very still at a field edge with 80+ ft (25 m) distance and telephoto.',
    bestTimeToSpot: 'Dawn and dusk in open farmland and grassland.',
  },
  'palmate-newt': {
    whatIsIt:
      'Small pond-breeding salamander. Breeding males show a crested tail in spring water.',
    safetyLevel: 'low',
    safetyNote: 'Harmless; protect pond habitat and avoid trampling vegetation at the shore.',
    approachTip:
      'Kneel at the bank from 3–4 ft (1 m) away; polarizing filter helps cut glare on water.',
    bestTimeToSpot: 'Spring evenings at shallow, vegetation-rich ponds.',
  },
  'tawny-owl': {
    whatIsIt:
      'Common Eurasian woodland owl with rounded head and haunting hoots. Often roosts in dense trees by day.',
    safetyLevel: 'moderate',
    safetyNote: 'Talons are sharp. Do not approach injured birds — call wildlife rescue.',
    approachTip: 'Find roosts with care from a distance; use binoculars, not tree climbing.',
    bestTimeToSpot: 'Night for calls; occasional winter daylight roosts in evergreens.',
  },
  'european-robin': {
    whatIsIt:
      'Small songbird with an orange face and breast, territorial on winter territories.',
    safetyLevel: 'low',
    safetyNote: 'Harmless. May approach gardeners for disturbed worms — still keep a respectful distance.',
    approachTip: 'Stay low and still 6–10 ft (2–3 m) away in quiet gardens.',
    bestTimeToSpot: 'Morning in gardens and woodland edges, year-round in much of Europe.',
  },
  bumblebee: {
    whatIsIt: 'Fuzzy pollinator; workers visit flowers while queens start nests in spring.',
    safetyLevel: 'moderate',
    safetyNote: 'Can sting if squeezed or stepped on. Avoid swatting; give flowers a calm path.',
    approachTip: 'Hold still 1–2 ft (0.3–0.6 m) from blooms; fast shutter for flight shots.',
    bestTimeToSpot: 'Sunny mid-morning to afternoon on native flowers.',
  },
}

const KINGDOM_FALLBACK: Record<KingdomKey, NearbyFieldGuide> = {
  mammal: {
    whatIsIt: 'A wild mammal reported near this location.',
    safetyLevel: 'moderate',
    safetyNote:
      'Wild mammals can bite or carry disease. Never feed, touch, or corner an animal — especially adults with young.',
    approachTip:
      'Stay at least 50–100 ft (15–30 m) away, use binoculars or telephoto, and keep pets leashed.',
    bestTimeToSpot: NA,
  },
  bird: {
    whatIsIt: 'A wild bird reported near this location.',
    safetyLevel: 'low',
    safetyNote:
      'Usually safe at a distance. Avoid disturbing nests or roosts; some raptors have powerful talons.',
    approachTip:
      'Stay 20–30 ft (6–10 m) back, move slowly, and photograph with zoom rather than approaching.',
    bestTimeToSpot: 'Dawn and dusk for most songbirds; check habitat-specific seasonality.',
  },
  reptile: {
    whatIsIt: 'A reptile reported near this location.',
    safetyLevel: 'moderate',
    safetyNote:
      'Some species are venomous depending on region. Do not handle unknown snakes or lizards.',
    approachTip: 'Keep 10–15 ft (3–5 m) or more for snakes; photograph with zoom only.',
    bestTimeToSpot: 'Warm mornings when basking; spring for many temperate species.',
  },
  amphibian: {
    whatIsIt: 'An amphibian reported near this location.',
    safetyLevel: 'low',
    safetyNote: 'Generally harmless; avoid touching and respect sensitive wetland edges.',
    approachTip: 'Stay at the waterline; low, steady shots from 2–4 ft (0.5–1 m).',
    bestTimeToSpot: 'Warm, wet evenings, especially spring breeding windows.',
  },
  fish: {
    whatIsIt: 'A fish or aquatic animal observation near this location.',
    safetyLevel: 'low',
    safetyNote: 'Observe from shore or pier; mind slippery banks and current.',
    approachTip: 'Polarized glasses help see into water; photograph from a safe vantage only.',
    bestTimeToSpot: NA,
  },
  insect: {
    whatIsIt: 'An insect reported near this location.',
    safetyLevel: 'low',
    safetyNote: 'Most are harmless; wasps, bees, and some beetles can sting or pinch.',
    approachTip: 'Approach slowly without blocking flight path; macro from 1–2 ft (0.3–0.6 m).',
    bestTimeToSpot: 'Sunny midday on calm days for many flower visitors.',
  },
  arachnid: {
    whatIsIt: 'An arachnid reported near this location.',
    safetyLevel: 'moderate',
    safetyNote: 'Assume some species may be venomous. Do not handle with bare hands.',
    approachTip: 'Photograph from 2–3 ft (0.5–1 m); do not poke webs or burrows.',
    bestTimeToSpot: NA,
  },
  mollusc: {
    whatIsIt: 'A mollusc reported near this location.',
    safetyLevel: 'low',
    safetyNote: 'Generally safe; tide pools and shores can be slippery.',
    approachTip: 'Low angle from shore; avoid stepping on habitat.',
    bestTimeToSpot: 'Low tide for many intertidal species.',
  },
  plant: {
    whatIsIt: 'A plant or fungus observation near this location.',
    safetyLevel: 'low',
    safetyNote: 'Do not eat unknown plants or mushrooms.',
    approachTip: 'Photograph leaves, flowers, or cap from multiple angles for ID.',
    bestTimeToSpot: NA,
  },
}

export function hasSpecificFieldGuide(sighting: NearbyMapSighting): boolean {
  const slug = slugifySpeciesName(sighting.speciesId?.trim() || sighting.name)
  const byName = slugifySpeciesName(sighting.name)
  return Boolean(BY_SLUG[slug] ?? BY_SLUG[byName])
}

export function resolveSpeciesLookupKey(sighting: NearbyMapSighting): string {
  if (sighting.speciesId?.trim()) return sighting.speciesId.trim().toLowerCase()
  return slugifySpeciesName(sighting.name)
}

export function resolveNearbyFieldGuide(
  sighting: NearbyMapSighting,
  descriptionFallback?: string | null,
): NearbyFieldGuide {
  const slug = resolveSpeciesLookupKey(sighting)
  const byName = slugifySpeciesName(sighting.name)
  const entry = BY_SLUG[slug] ?? BY_SLUG[byName]
  if (entry) return entry

  const kingdomGuide = KINGDOM_FALLBACK[sighting.kingdom]
  if (descriptionFallback?.trim()) {
    return {
      ...kingdomGuide,
      whatIsIt: descriptionFallback.trim(),
    }
  }

  return kingdomGuide
}

export function nearbySafetyLabel(level: NearbySafetyLevel): string {
  if (level === 'high') return 'Use extra caution'
  if (level === 'moderate') return 'Be cautious'
  return 'Generally safe at a distance'
}
