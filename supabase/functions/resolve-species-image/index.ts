import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resolves the best reference image for a species, VERIFIES it loads, DOWNLOADS it
// into our own Supabase Storage bucket, caches the permanent URL, and returns it.
// After the first resolve, every client loads the image from our CDN — no
// dependency on Wikimedia/iNat uptime, no rate limits, no broken thumbnails.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const GOOGLE_SEARCH_API_KEY = Deno.env.get('GOOGLE_SEARCH_API_KEY') ?? ''
const GOOGLE_SEARCH_CX = Deno.env.get('GOOGLE_SEARCH_CX') ?? ''

const BUCKET = 'species-images'
const UA = 'WildKind/1.0 (https://wildkind.app; reference-image-resolver)'

const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

// iNat iconic_taxon_name → WildKind kingdom (reject cross-category matches).
const INAT_ICONIC: Record<string, string> = {
  Mammalia: 'mammal', Aves: 'bird', Reptilia: 'reptile', Amphibia: 'amphibian',
  Actinopterygii: 'fish', Insecta: 'insect', Arachnida: 'arachnid', Mollusca: 'mollusc',
  Plantae: 'plant', Fungi: 'fungi',
}

interface Input {
  commonName?: string
  scientificName?: string | null
  kingdom?: string | null
  dexNum?: string | null
  speciesId?: string | null
  taxonId?: string | number | null
  isDomestic?: boolean
}

const norm = (s?: string | null): string => (s ?? '').trim()

function buildKey(i: Input): string {
  const category = i.isDomestic ? 'domestic' : (norm(i.kingdom) || 'unknown')
  return [
    norm(i.commonName).toLowerCase(),
    norm(i.scientificName).toLowerCase(),
    category,
    norm(i.dexNum),
    norm(i.speciesId),
  ].join('|')
}

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// ─── Source lookups (each returns 0+ candidate URLs, tried in order) ───────────

async function fromDomestic(i: Input): Promise<string[]> {
  const dex = norm(i.dexNum).replace(/^#/, '')
  if (dex) {
    const { data } = await admin.from('domestic_species').select('reference_image_url').eq('dex_number', dex).maybeSingle()
    if (data?.reference_image_url) return [data.reference_image_url.trim()]
  }
  const name = norm(i.commonName)
  if (name) {
    const { data } = await admin.from('domestic_species').select('reference_image_url').ilike('common_name', name).maybeSingle()
    if (data?.reference_image_url) return [data.reference_image_url.trim()]
  }
  return []
}

async function fromSpeciesTable(i: Input): Promise<string[]> {
  const sid = norm(i.speciesId)
  if (sid) {
    const { data } = await admin.from('species').select('image_url').eq('slug', sid).maybeSingle()
    if (data?.image_url) return [data.image_url.trim()]
  }
  const dex = norm(i.dexNum)
  if (dex) {
    const { data } = await admin.from('species').select('image_url').eq('dex_number', dex).maybeSingle()
    if (data?.image_url) return [data.image_url.trim()]
  }
  return []
}

async function fromInat(query: string, kingdom: string | null): Promise<string[]> {
  if (!query) return []
  const res = await fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(query)}&per_page=10`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`inat ${res.status}`)
  const d = await res.json() as { results?: { default_photo?: { medium_url?: string; square_url?: string }; iconic_taxon_name?: string }[] }
  for (const r of d.results ?? []) {
    if (kingdom && r.iconic_taxon_name) {
      const tk = INAT_ICONIC[r.iconic_taxon_name]
      if (tk) {
        const normalised = kingdom === 'tree' || kingdom === 'flower' ? 'plant' : kingdom
        if (tk !== normalised) continue
      }
    }
    const u = r.default_photo?.medium_url ?? r.default_photo?.square_url
    if (u) return [u]
  }
  return []
}

async function fromWikipedia(query: string): Promise<string[]> {
  if (!query) return []
  const title = query.trim().replace(/ /g, '_')
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`wiki ${res.status}`)
  const d = await res.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string; width?: number } }
  const thumb = d.thumbnail?.source
  if (thumb) {
    // Never request a thumb wider than the source — Wikimedia 400s on upscale.
    const w = d.originalimage?.width
    const target = w ? Math.min(800, w) : 480
    return [thumb.replace(/\/\d+px-/, `/${target}px-`)]
  }
  return d.originalimage?.source ? [d.originalimage.source] : []
}

async function fromWikimedia(query: string): Promise<string[]> {
  if (!query) return []
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}` +
      `&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url&iiurlwidth=640&format=json&origin=*`,
    { headers: { 'User-Agent': UA } },
  )
  if (!res.ok) throw new Error(`wikimedia ${res.status}`)
  const d = await res.json() as { query?: { pages?: Record<string, { imageinfo?: { thumburl?: string; url?: string }[] }> } }
  const out: string[] = []
  for (const p of Object.values(d.query?.pages ?? {})) {
    const ii = p.imageinfo?.[0]
    if (ii?.thumburl) out.push(ii.thumburl)
    else if (ii?.url) out.push(ii.url)
  }
  return out
}

async function fromGoogle(query: string): Promise<string[]> {
  if (!query || !GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_CX) return []
  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_CX}` +
      `&searchType=image&num=5&safe=active&q=${encodeURIComponent(query)}`,
  )
  if (!res.ok) throw new Error(`google ${res.status}`)
  const d = await res.json() as { items?: { link?: string }[] }
  return (d.items ?? []).map((i) => i.link).filter((l): l is string => !!l)
}

// ─── Verify + download + store ─────────────────────────────────────────────────

async function fetchImageBytes(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? ''
    if (!ct.startsWith('image/')) return null
    const bytes = new Uint8Array(await res.arrayBuffer())
    if (bytes.byteLength < 512) return null // reject 1x1 / error placeholders
    return { bytes, contentType: ct }
  } catch {
    return null
  }
}

function extFor(contentType: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  if (contentType.includes('gif')) return 'gif'
  if (contentType.includes('svg')) return 'svg'
  return 'jpg'
}

async function storeAndCache(
  input: Input,
  cacheKey: string,
  img: { bytes: Uint8Array; contentType: string },
  source: string,
): Promise<string> {
  const path = `${await sha256hex(cacheKey)}.${extFor(img.contentType)}`
  await admin.storage.from(BUCKET).upload(path, img.bytes, { contentType: img.contentType, upsert: true })
  const { data } = admin.storage.from(BUCKET).getPublicUrl(path)
  const publicUrl = data.publicUrl
  await admin.from('species_image_cache').upsert(
    {
      cache_key: cacheKey,
      common_name: norm(input.commonName) || null,
      scientific_name: norm(input.scientificName) || null,
      kingdom: norm(input.kingdom) || null,
      category: input.isDomestic ? 'domestic' : (norm(input.kingdom) || 'unknown'),
      dex_num: norm(input.dexNum) || null,
      species_id: norm(input.speciesId) || null,
      taxon_id: input.taxonId != null ? String(input.taxonId) : null,
      image_url: publicUrl,
      source,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'cache_key' },
  )
  return publicUrl
}

// ─── Handler ───────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  let input: Input = {}
  try {
    input = await req.json() as Input
  } catch {
    return json({ uri: null, source: 'needs_id_placeholder', reason: 'bad_request' }, 400)
  }

  const commonName = norm(input.commonName)
  const scientificName = norm(input.scientificName)
  const kingdom = norm(input.kingdom) || null
  if (!commonName && !scientificName) {
    return json({ uri: null, source: 'needs_id_placeholder', reason: 'no_identity' })
  }

  const cacheKey = buildKey(input)

  // 0. Cache hit → permanent stored URL.
  try {
    const { data: cached } = await admin
      .from('species_image_cache')
      .select('image_url, source')
      .eq('cache_key', cacheKey)
      .maybeSingle()
    if (cached?.image_url) return json({ uri: cached.image_url, source: cached.source, reason: 'cache' })
  } catch { /* fall through to resolve */ }

  const isDomestic = input.isDomestic === true || /^#?D\d/i.test(norm(input.dexNum))

  const attempts: { source: string; run: () => Promise<string[]> }[] = [
    ...(isDomestic ? [{ source: 'domestic_registry', run: () => fromDomestic(input) }] : []),
    { source: 'database', run: () => fromSpeciesTable(input) },
    { source: 'inaturalist', run: () => fromInat(commonName, kingdom) },
    { source: 'wikipedia', run: () => fromWikipedia(commonName) },
    { source: 'inaturalist', run: () => fromInat(scientificName, kingdom) },
    { source: 'wikipedia', run: () => fromWikipedia(scientificName) },
    { source: 'wikimedia', run: () => fromWikimedia(commonName || scientificName) },
    { source: 'google', run: () => fromGoogle(commonName || scientificName) },
  ]

  for (const attempt of attempts) {
    let urls: string[] = []
    try {
      urls = await attempt.run()
    } catch {
      continue // transient source error — try the next source
    }
    for (const url of urls) {
      const img = await fetchImageBytes(url)
      if (!img) continue
      try {
        const stored = await storeAndCache(input, cacheKey, img, attempt.source)
        return json({ uri: stored, source: attempt.source, reason: attempt.source })
      } catch (e) {
        // storage failed — still return the verified external URL so the UI shows something
        return json({ uri: url, source: attempt.source, reason: `${attempt.source}_nostore`, warn: String(e) })
      }
    }
  }

  // Nothing resolved — caller shows its category placeholder. NOT cached (retry later).
  return json({ uri: null, source: 'needs_id_placeholder', reason: 'no_image_found' })
})
