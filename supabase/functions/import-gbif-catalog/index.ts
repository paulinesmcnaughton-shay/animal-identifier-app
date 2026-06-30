import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ONE-TIME catalog importer. Pages the GBIF backbone (open / CC0 taxonomy) by
// higher taxon and upserts accepted species into public.species. Resumable: the
// caller passes (highertaxonKey, offset) and loops until offset >= count.
// Dex numbers are assigned in a separate SQL pass after all rows land.
//
// GBIF only — no iNaturalist, no Google. Taxonomy is CC0.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const GBIF_BACKBONE = 'd7dddbf4-2cf0-4f39-9b2a-bb099caae36c'
const UA = 'WildKind/1.0 (https://wildkind.app; catalog-import)'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const CLASS_TO_KINGDOM: Record<string, string> = {
  Mammalia: 'mammal',
  Aves: 'bird',
  Reptilia: 'reptile',
  Squamata: 'reptile',
  Testudines: 'reptile',
  Crocodylia: 'reptile',
  Amphibia: 'amphibian',
  Actinopterygii: 'fish',
  Chondrichthyes: 'fish',
  Elasmobranchii: 'fish',
  Sarcopterygii: 'fish',
  Cephalaspidomorphi: 'fish',
  Myxini: 'fish',
  Insecta: 'insect',
  Arachnida: 'arachnid',
  Mollusca: 'mollusc',
  Bivalvia: 'mollusc',
  Gastropoda: 'mollusc',
  Cephalopoda: 'mollusc',
  Polyplacophora: 'mollusc',
}

interface GbifResult {
  key?: number
  nubKey?: number
  canonicalName?: string
  scientificName?: string
  kingdom?: string
  phylum?: string
  class?: string
  order?: string
  family?: string
  genus?: string
  rank?: string
  taxonomicStatus?: string
  vernacularNames?: Array<{ vernacularName?: string; language?: string }>
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function englishVernacular(r: GbifResult): string | null {
  const names = r.vernacularNames ?? []
  const eng = names.find((n) => n.language === 'eng' && n.vernacularName)?.vernacularName
  if (!eng) return null
  // Title-case the common name; GBIF mixes cases.
  return eng.replace(/\b\w/g, (c) => c.toUpperCase()).trim()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const highertaxonKey = Number(body.highertaxonKey)
    const offset = Math.max(0, Number(body.offset) || 0)
    const limit = Math.min(1000, Math.max(1, Number(body.limit) || 1000))
    const fallbackKingdom = typeof body.fallbackKingdom === 'string' ? body.fallbackKingdom : null
    if (!highertaxonKey) return json({ error: 'highertaxonKey required' }, 400)

    const url =
      `https://api.gbif.org/v1/species/search?datasetKey=${GBIF_BACKBONE}` +
      `&highertaxonKey=${highertaxonKey}&rank=SPECIES&status=ACCEPTED&highlight=false` +
      `&limit=${limit}&offset=${offset}`
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } })
    if (!res.ok) return json({ error: `gbif ${res.status}` }, 502)
    const data = await res.json()
    const results: GbifResult[] = Array.isArray(data?.results) ? data.results : []
    const count: number = Number(data?.count) || 0

    const seen = new Set<string>()
    const rows = []
    for (const r of results) {
      const key = r.nubKey ?? r.key
      const latin = (r.canonicalName || r.scientificName || '').trim()
      if (!key || !latin) continue
      const kingdom = CLASS_TO_KINGDOM[r.class ?? ''] ?? fallbackKingdom
      if (!kingdom) continue
      const id = `gbif-${key}`
      if (seen.has(id)) continue
      seen.add(id)
      const common = englishVernacular(r) || latin
      rows.push({
        id,
        slug: slugify(latin),
        common_name: common,
        latin_name: latin,
        kingdom,
        sounds: false,
        taxonomy: {
          kingdom: r.kingdom ?? null,
          phylum: r.phylum ?? null,
          class: r.class ?? null,
          order: r.order ?? null,
          family: r.family ?? null,
          genus: r.genus ?? null,
          gbifKey: key,
          source: 'gbif.backbone',
        },
      })
    }

    let upserted = 0
    if (rows.length) {
      const { error, count: upCount } = await admin
        .from('species')
        .upsert(rows, { onConflict: 'id', ignoreDuplicates: false, count: 'exact' })
      if (error) return json({ error: error.message }, 500)
      upserted = upCount ?? rows.length
    }

    const nextOffset = offset + limit
    return json({ fetched: results.length, mapped: rows.length, upserted, count, nextOffset, done: nextOffset >= count })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
