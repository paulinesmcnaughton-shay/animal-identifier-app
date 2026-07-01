import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Occurrence-RANKED catalog import. For a taxon, pages GBIF's occurrence facet
// (species ordered by how often they've actually been observed) and upserts the
// most-observed species — so famous animals are guaranteed in, ranked by real
// sightings. Resumable via facetOffset. GBIF backbone (CC0) only.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
const UA = 'WildKind/1.0 (https://wildkind.app; catalog-import)'
const CONCURRENCY = 10

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const CLASS_TO_KINGDOM: Record<string, string> = {
  Mammalia: 'mammal', Aves: 'bird',
  Reptilia: 'reptile', Squamata: 'reptile', Testudines: 'reptile', Crocodylia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish', Chondrichthyes: 'fish', Elasmobranchii: 'fish', Sarcopterygii: 'fish',
  Insecta: 'insect', Arachnida: 'arachnid',
  Mollusca: 'mollusc', Bivalvia: 'mollusc', Gastropoda: 'mollusc', Cephalopoda: 'mollusc',
}

function slugify(v: string): string {
  return v.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}
function titleCase(v: string): string {
  return v.replace(/\b\w/g, (c) => c.toUpperCase()).trim()
}

interface GbifSpecies {
  canonicalName?: string
  scientificName?: string
  rank?: string
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  vernacularName?: string
}

async function resolveKey(key: string, count: number, fallbackKingdom: string) {
  try {
    // GBIF negotiates vernacularName by Accept-Language — force English.
    const res = await fetch(`https://api.gbif.org/v1/species/${key}`, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en' },
    })
    if (!res.ok) return null
    const s = (await res.json()) as GbifSpecies
    if (s.rank !== 'SPECIES') return null
    const latin = (s.canonicalName || s.scientificName || '').trim()
    if (!latin) return null
    const kingdom = CLASS_TO_KINGDOM[s.class ?? ''] ?? fallbackKingdom
    const common = s.vernacularName ? titleCase(s.vernacularName) : latin
    return {
      id: `gbif-${key}`,
      slug: slugify(latin),
      common_name: common,
      latin_name: latin,
      kingdom,
      occurrence_count: count,
      sounds: false,
      taxonomy: {
        kingdom: s.kingdom ?? null, phylum: s.phylum ?? null, class: s.class ?? null,
        order: s.order ?? null, family: s.family ?? null, genus: s.genus ?? null,
        gbifKey: Number(key), source: 'gbif.occurrence',
      },
    }
  } catch {
    return null
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const taxonKey = Number(body.taxonKey)
    const facetOffset = Math.max(0, Number(body.facetOffset) || 0)
    const facetLimit = Math.min(250, Math.max(1, Number(body.facetLimit) || 200))
    const fallbackKingdom = typeof body.fallbackKingdom === 'string' ? body.fallbackKingdom : 'mammal'
    if (!taxonKey) return json({ error: 'taxonKey required' }, 400)

    const facetUrl =
      `https://api.gbif.org/v1/occurrence/search?taxonKey=${taxonKey}` +
      `&facet=speciesKey&facetLimit=${facetLimit}&facetOffset=${facetOffset}&limit=0`
    const res = await fetch(facetUrl, { headers: { 'User-Agent': UA } })
    if (!res.ok) return json({ error: `gbif ${res.status}` }, 502)
    const data = await res.json()
    const counts: Array<{ name: string; count: number }> = data?.facets?.[0]?.counts ?? []
    if (counts.length === 0) return json({ processed: 0, upserted: 0, nextFacetOffset: facetOffset, done: true })

    const rows = []
    for (let i = 0; i < counts.length; i += CONCURRENCY) {
      const slice = counts.slice(i, i + CONCURRENCY)
      const resolved = await Promise.all(slice.map((c) => resolveKey(c.name, c.count, fallbackKingdom)))
      for (const r of resolved) if (r) rows.push(r)
    }

    let upserted = 0
    if (rows.length) {
      const { error, count } = await admin.from('species').upsert(rows, { onConflict: 'id', count: 'exact' })
      if (error) return json({ error: error.message }, 500)
      upserted = count ?? rows.length
    }
    return json({
      processed: counts.length,
      upserted,
      nextFacetOffset: facetOffset + facetLimit,
      done: counts.length < facetLimit,
    })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
