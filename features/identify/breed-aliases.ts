const BREED_ALIASES: Record<string, string> = {
  corgi: 'Pembroke Welsh Corgi',
  'welsh corgi': 'Pembroke Welsh Corgi',
  'pembroke corgi': 'Pembroke Welsh Corgi',
  pembroke: 'Pembroke Welsh Corgi',
  lab: 'Labrador Retriever',
  labrador: 'Labrador Retriever',
  'golden retriever': 'Golden Retriever',
  'german shepherd': 'German Shepherd',
  shepherd: 'German Shepherd',
  'french bulldog': 'French Bulldog',
  bulldog: 'Bulldog',
  poodle: 'Poodle',
  beagle: 'Beagle',
  husky: 'Siberian Husky',
  'siberian husky': 'Siberian Husky',
  dachshund: 'Dachshund',
  chihuahua: 'Chihuahua',
  pug: 'Pug',
  'shih tzu': 'Shih Tzu',
  boxer: 'Boxer',
  rottweiler: 'Rottweiler',
  'yorkshire terrier': 'Yorkshire Terrier',
  yorkie: 'Yorkshire Terrier',
}

export function applyBreedAlias(commonName: string): string {
  const trimmed = commonName.trim()
  if (!trimmed) return commonName

  const lower = trimmed.toLowerCase()
  if (BREED_ALIASES[lower]) return BREED_ALIASES[lower]

  for (const [alias, canonical] of Object.entries(BREED_ALIASES)) {
    if (lower.includes(alias)) return canonical
  }

  return trimmed
}
