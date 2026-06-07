import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resolves a species' "What it is" description (Wikipedia) and taxonomy (GBIF —
// the same source the app uses for identification), and caches them so every
// client gets real, owned content instead of a generic template.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const UA = 'WildKind/1.0 (https://wildkind.app; species-detail-resolver)'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

interface Input {
  commonName?: string
  scientificName?: string | null
  kingdom?: string | null
  dexNum?: string | null
  speciesId?: string | null
  isDomestic?: boolean
}

const norm = (s?: string | null): string => (s ?? '').trim()

function buildKey(i: Input): string {
  const category = i.isDomestic ? 'domestic' : (norm(i.kingdom) || 'unknown')
  return [norm(i.commonName).toLowerCase(), norm(i.scientificName).toLowerCase(), category, norm(i.dexNum), norm(i.speciesId)].join('|')
}

function petKindFor(commonName: string, scientificName: string): 'dog' | 'cat' {
  const sci = scientificName.toLowerCase()
  if (sci.includes('felis')) return 'cat'
  if (sci.includes('canis')) return 'dog'
  if (/\b(cat|feline|kitten|tabby|siamese|persian|ragdoll|sphynx|bengal|abyssinian|burmese|birman|manx|shorthair|longhair|maine coon|rex|bombay|savannah|ragamuffin)\b/.test(commonName.toLowerCase())) {
    return 'cat'
  }
  return 'dog'
}

// Intro description (a few sentences) of the top Wikipedia page matching the query.
async function wikiDescription(query: string): Promise<string | null> {
  if (!query) return null
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrlimit=1&prop=extracts&exintro=1&explaintext=1&exsentences=3&format=json&origin=*`,
    { headers: { 'User-Agent': UA } },
  )
  if (!res.ok) throw new Error(`wikidesc ${res.status}`)
  const d = await res.json() as { query?: { pages?: Record<string, { extract?: string }> } }
  const pages = Object.values(d.query?.pages ?? {})
  const ex = pages[0]?.extract?.trim()
  return ex && ex.length > 20 ? ex : null
}

interface Taxonomy {
  kingdom: string | null
  phylum: string | null
  class: string | null
  order: string | null
  family: string | null
  genus: string | null
}

// Full taxonomy from GBIF's name matcher.
async function gbifTaxonomy(name: string): Promise<Taxonomy | null> {
  if (!name) return null
  const res = await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`gbif ${res.status}`)
  const d = await res.json() as {
    matchType?: string; kingdom?: string; phylum?: string; class?: string; order?: string; family?: string; genus?: string
  }
  if (!d || d.matchType === 'NONE') return null
  if (!d.kingdom && !d.phylum && !d.class) return null
  return {
    kingdom: d.kingdom ?? null,
    phylum: d.phylum ?? null,
    class: d.class ?? null,
    order: d.order ?? null,
    family: d.family ?? null,
    genus: d.genus ?? null,
  }
}

async function tryEach<T>(fns: (() => Promise<T | null>)[]): Promise<T | null> {
  for (const fn of fns) {
    try {
      const r = await fn()
      if (r) return r
    } catch { /* try next */ }
  }
  return null
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let input: Input = {}
  try {
    input = await req.json() as Input
  } catch {
    return json({ description: null, taxonomy: null, reason: 'bad_request' }, 400)
  }

  const commonName = norm(input.commonName)
  const scientificName = norm(input.scientificName)
  if (!commonName && !scientificName) return json({ description: null, taxonomy: null, reason: 'no_identity' })

  const cacheKey = buildKey(input)

  // Cache hit
  try {
    const { data: c } = await admin
      .from('species_detail_cache')
      .select('description, tax_kingdom, tax_phylum, tax_class, tax_order, tax_family, tax_genus, source')
      .eq('cache_key', cacheKey)
      .maybeSingle()
    if (c && (c.description || c.tax_class)) {
      return json({
        description: c.description ?? null,
        taxonomy: { kingdom: c.tax_kingdom, phylum: c.tax_phylum, class: c.tax_class, order: c.tax_order, family: c.tax_family, genus: c.tax_genus },
        source: c.source ?? 'cache',
        reason: 'cache',
      })
    }
  } catch { /* resolve */ }

  const isDomestic = input.isDomestic === true || /^#?D\d/i.test(norm(input.dexNum))
  const petKind = petKindFor(commonName, scientificName)
  const descQuery = isDomestic ? `${commonName} ${petKind} breed` : (commonName || scientificName)

  const [description, taxonomy] = await Promise.all([
    tryEach([() => wikiDescription(descQuery), () => wikiDescription(scientificName), () => wikiDescription(commonName)]),
    tryEach([() => gbifTaxonomy(scientificName), () => gbifTaxonomy(commonName)]),
  ])

  if (!description && !taxonomy) {
    return json({ description: null, taxonomy: null, reason: 'not_found' })
  }

  try {
    await admin.from('species_detail_cache').upsert(
      {
        cache_key: cacheKey,
        common_name: commonName || null,
        scientific_name: scientificName || null,
        kingdom: norm(input.kingdom) || null,
        category: isDomestic ? 'domestic' : (norm(input.kingdom) || 'unknown'),
        dex_num: norm(input.dexNum) || null,
        species_id: norm(input.speciesId) || null,
        description: description ?? null,
        tax_kingdom: taxonomy?.kingdom ?? null,
        tax_phylum: taxonomy?.phylum ?? null,
        tax_class: taxonomy?.class ?? null,
        tax_order: taxonomy?.order ?? null,
        tax_family: taxonomy?.family ?? null,
        tax_genus: taxonomy?.genus ?? null,
        source: 'wikipedia+gbif',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' },
    )
  } catch { /* return anyway */ }

  return json({ description, taxonomy, source: 'wikipedia+gbif', reason: 'resolved' })
})
