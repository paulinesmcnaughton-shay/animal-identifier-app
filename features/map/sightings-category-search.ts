import type { NearbyMapSighting } from '@/features/map/map-sighting'

// Broad category terms → related species names, genus patterns, breed names.
// Enables "dog" to match Corgi, Labrador, etc. and "frog" to match any frog species.
const CATEGORY_EXPANSIONS: Record<string, string[]> = {
  dog: [
    'dog', 'puppy', 'canis lupus familiaris', 'canis familiaris',
    'retriever', 'shepherd', 'spaniel', 'terrier', 'poodle', 'corgi',
    'beagle', 'labrador', 'husky', 'bulldog', 'dachshund', 'pug',
    'chihuahua', 'boxer', 'rottweiler', 'dalmatian', 'collie', 'hound',
    'setter', 'pointer', 'mastiff', 'greyhound', 'samoyed', 'akita',
    'shiba', 'maltese', 'yorkshire', 'schnauzer', 'doberman', 'pitbull',
    'bully', 'german shepherd', 'border collie', 'golden retriever',
    'cocker spaniel', 'whippet', 'bloodhound', 'weimaraner', 'vizsla',
    'basenji', 'coonhound', 'foxhound', 'wolfhound', 'deerhound',
    'borzoi', 'saluki', 'pembroke', 'cardigan', 'pomeranian', 'chow chow',
    'malamute', 'bernese', 'newfoundland', 'saint bernard', 'great dane',
    'great pyrenees', 'leonberger', 'kuvasz', 'dingo', 'mutt', 'mixed breed',
  ],
  cat: [
    'cat', 'kitten', 'kitty', 'feline', 'felis catus',
    'tabby', 'siamese', 'persian', 'bengal', 'ragdoll', 'sphynx', 'sphinx',
    'burmese', 'maine coon', 'abyssinian', 'scottish fold',
    'british shorthair', 'russian blue', 'savannah', 'tonkinese',
    'oriental', 'birman', 'ocicat', 'bombay', 'devon rex', 'cornish rex',
    'turkish angora', 'norwegian forest', 'himalayan', 'balinese',
    'manx', 'american shorthair', 'chartreux',
  ],
  rabbit: [
    'rabbit', 'bunny', 'bun', 'oryctolagus', 'hare', 'cottontail',
    'jackrabbit', 'angora', 'lop', 'rex', 'flemish', 'lionhead',
    'dutch rabbit', 'mini rex', 'new zealand rabbit', 'palomino',
    'californian rabbit', 'holland lop', 'mini lop',
  ],
  bunny: [
    'rabbit', 'bunny', 'bun', 'hare', 'cottontail', 'angora', 'lop',
    'rex', 'lionhead', 'oryctolagus',
  ],
  hare: ['hare', 'jackrabbit', 'lepus', 'cottontail'],
  fish: [
    'fish', 'goldfish', 'koi', 'bass', 'salmon', 'trout', 'tuna', 'cod',
    'tilapia', 'carp', 'cichlid', 'guppy', 'betta', 'tetra', 'clownfish',
    'pike', 'perch', 'mackerel', 'herring', 'sardine', 'anchovy', 'eel',
    'catfish', 'sturgeon', 'halibut', 'flounder', 'snapper', 'grouper',
    'swordfish', 'marlin', 'angelfish', 'discus', 'oscar', 'pleco',
    'molly', 'platy', 'danio', 'barb', 'rasbora', 'loach', 'gourami',
    'zebra fish', 'zebrafish', 'rainbow fish',
  ],
  frog: [
    'frog', 'treefrog', 'tree frog', 'bullfrog', 'rain frog',
    'dart frog', 'poison frog', 'rana', 'lithobates', 'hyla',
    'xenopus', 'ceratophrys', 'pacman frog', 'african clawed frog',
    'tomato frog', 'whites tree frog', 'amazon milk frog',
  ],
  toad: [
    'toad', 'frog', 'bufo', 'rhinella', 'anaxyrus',
    'american toad', 'common toad', 'fire-bellied toad',
  ],
  lizard: [
    'lizard', 'gecko', 'iguana', 'anole', 'skink', 'monitor',
    'chameleon', 'bearded dragon', 'komodo', 'blue tongue',
    'agama', 'uromastyx', 'tegu', 'frilled lizard', 'crested gecko',
    'leopard gecko', 'day gecko', 'tokay', 'savannah monitor',
    'ackie monitor', 'water dragon', 'green iguana', 'rhino iguana',
  ],
  gecko: [
    'gecko', 'crested gecko', 'leopard gecko', 'tokay gecko',
    'day gecko', 'gargoyle gecko', 'mourning gecko', 'flying gecko',
  ],
  snake: [
    'snake', 'serpent', 'viper', 'python', 'boa', 'cobra', 'rattlesnake',
    'garter snake', 'king snake', 'corn snake', 'ball python',
    'milk snake', 'moccasin', 'copperhead', 'mamba', 'racer',
    'hognose', 'bull snake', 'rat snake', 'boa constrictor',
    'reticulated python', 'burmese python', 'green tree python',
  ],
  turtle: [
    'turtle', 'box turtle', 'painted turtle', 'red-eared slider',
    'snapping turtle', 'map turtle', 'cooter', 'slider',
    'musk turtle', 'mud turtle', 'sea turtle',
  ],
  tortoise: [
    'tortoise', 'turtle', 'testudo', 'sulcata', 'leopard tortoise',
    'russian tortoise', 'greek tortoise', 'red-footed tortoise',
    'aldabra tortoise',
  ],
  bird: [
    'bird', 'parrot', 'cockatiel', 'cockatoo', 'macaw', 'canary',
    'finch', 'budgie', 'budgerigar', 'parakeet', 'lovebird',
    'conure', 'african grey', 'amazon parrot', 'caique', 'eclectus',
    'lorikeet',
  ],
  hamster: [
    'hamster', 'dwarf hamster', 'syrian hamster', 'roborovski',
    'campbell hamster', 'winter white',
  ],
  gerbil: ['gerbil', 'meriones'],
  mouse: ['mouse', 'mice', 'mus musculus', 'fancy mouse'],
  rat: ['rat', 'rattus', 'fancy rat', 'dumbo rat'],
  guinea: ['guinea pig', 'cavy', 'cavia'],
  pig: ['pig', 'hog', 'boar', 'swine', 'guinea pig', 'miniature pig', 'pot-bellied pig'],
  horse: [
    'horse', 'pony', 'stallion', 'mare', 'foal', 'mule', 'donkey',
    'equus', 'arabian', 'thoroughbred', 'mustang', 'quarter horse',
    'appaloosa', 'paint horse', 'clydesdale', 'shire', 'percheron',
    'friesian', 'andalusian', 'warmblood',
  ],
  deer: [
    'deer', 'buck', 'doe', 'fawn', 'stag', 'elk', 'moose', 'reindeer',
    'caribou', 'antelope', 'whitetail', 'mule deer',
  ],
  bear: [
    'bear', 'grizzly', 'panda', 'polar bear', 'black bear', 'brown bear',
    'sun bear', 'sloth bear', 'ursus',
  ],
  fox: ['fox', 'vulpes', 'fennec', 'red fox', 'arctic fox', 'grey fox'],
  wolf: ['wolf', 'coyote', 'dingo', 'jackal', 'canis lupus'],
  squirrel: ['squirrel', 'chipmunk', 'flying squirrel', 'ground squirrel', 'sciurus'],
  raccoon: ['raccoon', 'racoon', 'procyon'],
  otter: ['otter', 'lutra', 'lontra', 'sea otter', 'river otter'],
  seal: ['seal', 'sea lion', 'walrus', 'phoca', 'zalophus'],
  butterfly: ['butterfly', 'monarch', 'swallowtail', 'fritillary', 'skipper', 'admiral'],
  moth: ['moth', 'luna moth', 'hawk moth', 'sphinx moth'],
  bee: ['bee', 'bumblebee', 'honeybee', 'apis', 'bombus'],
  wasp: ['wasp', 'hornet', 'yellowjacket', 'yellow jacket'],
  spider: ['spider', 'tarantula', 'orb weaver', 'wolf spider', 'jumping spider'],
  scorpion: ['scorpion', 'bark scorpion', 'emperor scorpion'],
  beetle: ['beetle', 'ladybug', 'ladybird', 'firefly', 'lightning bug', 'scarab', 'stag beetle'],
  ant: ['ant', 'fire ant', 'carpenter ant', 'formica'],
  snail: ['snail', 'slug', 'garden snail', 'helix'],
  crab: ['crab', 'lobster', 'shrimp', 'prawn', 'crawfish', 'crayfish', 'hermit crab'],
  shark: ['shark', 'ray', 'skate'],
  dolphin: ['dolphin', 'porpoise', 'delphinus'],
  whale: ['whale', 'orca', 'killer whale', 'sperm whale', 'humpback'],
  mushroom: [
    'mushroom', 'fungi', 'fungus', 'toadstool', 'mycelium',
    'amanita', 'boletus', 'chanterelle', 'oyster mushroom',
    'shiitake', 'portobello', 'cremini', 'button mushroom',
    'fly agaric', 'death cap', 'destroying angel', 'morel',
    'truffle', 'puffball', 'bracket fungus', 'turkey tail',
    "lion's mane", 'reishi', 'chaga', 'cordyceps', 'mycorrhizal',
  ],
  fungi: [
    'mushroom', 'fungi', 'fungus', 'toadstool', 'mycelium',
    'amanita', 'boletus', 'chanterelle', 'oyster mushroom',
    'shiitake', 'portobello', 'cremini', 'button mushroom',
    'fly agaric', 'death cap', 'morel', 'truffle', 'puffball',
    'bracket fungus', 'turkey tail', "lion's mane", 'reishi',
  ],
}

function resolveExpansions(query: string): string[] | null {
  const q = query.trim().toLowerCase()
  // Direct match
  if (CATEGORY_EXPANSIONS[q]) return CATEGORY_EXPANSIONS[q]!
  // -ies → -y: bunnies → bunny, puppies → puppy
  if (q.endsWith('ies')) {
    const stem = `${q.slice(0, -3)}y`
    if (CATEGORY_EXPANSIONS[stem]) return CATEGORY_EXPANSIONS[stem]!
  }
  // -ves → -f: wolves → wolf
  if (q.endsWith('ves')) {
    const stem = `${q.slice(0, -3)}f`
    if (CATEGORY_EXPANSIONS[stem]) return CATEGORY_EXPANSIONS[stem]!
  }
  // -es → strip: foxes → fox, tortoises → tortoise
  if (q.endsWith('es') && CATEGORY_EXPANSIONS[q.slice(0, -2)]) return CATEGORY_EXPANSIONS[q.slice(0, -2)]!
  // -s → strip: dogs → dog, cats → cat, frogs → frog
  if (q.endsWith('s') && CATEGORY_EXPANSIONS[q.slice(0, -1)]) return CATEGORY_EXPANSIONS[q.slice(0, -1)]!
  return null
}

function buildSearchable(s: NearbyMapSighting): string {
  return `${s.name} ${s.scientificName ?? ''} ${s.kingdom}`.toLowerCase()
}

function matchesTerms(searchable: string, terms: string[]): boolean {
  for (const term of terms) {
    if (term.includes(' ')) {
      if (searchable.includes(term)) return true
    } else {
      // Word-boundary: "cat" must not match inside "catfish"
      if (new RegExp(`\\b${term}\\b`).test(searchable)) return true
    }
  }
  return false
}

/**
 * Returns filtered results when the query is a known broad category (e.g. "dog", "fish").
 * Returns null when the query is not a known category — caller should use fuzzy search instead.
 */
export function categoryFilterSightings(
  items: NearbyMapSighting[],
  query: string,
): NearbyMapSighting[] | null {
  const expansions = resolveExpansions(query)
  if (!expansions) return null
  return items.filter((s) => matchesTerms(buildSearchable(s), expansions))
}
