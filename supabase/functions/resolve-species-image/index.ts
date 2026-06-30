import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resolves the best reference image for a species, VERIFIES it loads, DOWNLOADS it
// into our own Supabase Storage bucket, caches the permanent URL, and returns it.
// After the first resolve, every client loads the image from our CDN — no
// dependency on Wikimedia uptime, no rate limits, no broken thumbnails.
//
// PHOTO SOURCES ARE WIKIPEDIA + WIKIMEDIA COMMONS ONLY (CC-BY-SA / public domain,
// commercial-safe). iNaturalist and Google image search are intentionally not used.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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

// Reject composite/montage files (Wikipedia infobox grids like "Akita_Collage.png"
// or "..._breed_sampler.jpg") — we want a single-subject photo, not a 4-up grid.
function isMontage(url: string): boolean {
  let name = url
  try { name = decodeURIComponent(url) } catch { /* keep raw */ }
  return /collage|montage|sampler|composite|compilation|mosaic|varieties|assortment|infobox/i.test(name)
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

async function fromWikipedia(query: string): Promise<string[]> {
  if (!query) return []
  const title = query.trim().replace(/ /g, '_')
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}?redirect=true`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`wiki ${res.status}`)
  const d = await res.json() as { thumbnail?: { source?: string }; originalimage?: { source?: string; width?: number } }
  const thumb = d.thumbnail?.source
  if (thumb && !isMontage(thumb)) {
    // Never request a thumb wider than the source — Wikimedia 400s on upscale.
    const w = d.originalimage?.width
    const target = w ? Math.min(800, w) : 480
    return [thumb.replace(/\/\d+px-/, `/${target}px-`)]
  }
  return d.originalimage?.source && !isMontage(d.originalimage.source) ? [d.originalimage.source] : []
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
    const u = ii?.thumburl ?? ii?.url
    if (u && !isMontage(u)) out.push(u)
  }
  return out
}

// Full-text Wikipedia search → the matching page's image. Essential for dog/cat
// BREEDS: iNaturalist has no breed taxa (all dogs collapse to one Canis photo),
// but Wikipedia has a page per breed. Querying "Akita dog breed" finds it.
async function fromWikipediaSearch(query: string): Promise<string[]> {
  if (!query) return []
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&generator=search` +
      `&gsrsearch=${encodeURIComponent(query)}&gsrlimit=3&prop=pageimages` +
      `&piprop=thumbnail&pithumbsize=500&format=json&origin=*`,
    { headers: { 'User-Agent': UA } },
  )
  if (!res.ok) throw new Error(`wikisearch ${res.status}`)
  const d = await res.json() as { query?: { pages?: Record<string, { index?: number; thumbnail?: { source?: string } }> } }
  const pages = Object.values(d.query?.pages ?? {}).sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
  // Only the TOP (most relevant) page is the right breed — lower results are other
  // breeds. If its lead image is a montage, return nothing so we fall to Commons.
  const top = pages[0]?.thumbnail?.source
  return top && !isMontage(top) ? [top] : []
}

// Dog vs cat from the latin name (Canis/Felis) or breed-name keywords.
function petKindFor(commonName: string, scientificName: string): 'dog' | 'cat' {
  const sci = scientificName.toLowerCase()
  if (sci.includes('felis')) return 'cat'
  if (sci.includes('canis')) return 'dog'
  const n = commonName.toLowerCase()
  if (/\b(cat|feline|kitten|tabby|siamese|persian|ragdoll|sphynx|bengal|abyssinian|burmese|birman|manx|shorthair|longhair|maine coon|rex|bombay|savannah|ragamuffin)\b/.test(n)) {
    return 'cat'
  }
  return 'dog'
}

// ─── Attribution (CC-BY requires crediting author + license) ───────────────────

interface Attribution {
  author: string | null
  license: string | null
  sourceUrl: string | null
}

const EMPTY_ATTRIBUTION: Attribution = { author: null, license: null, sourceUrl: null }

function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}

// Wikipedia & Wikimedia images are Commons-hosted on upload.wikimedia.org. Pull the
// File: name out of the URL so we can look up its author + license on Commons.
function commonsFileName(url: string): string | null {
  const m = url.match(/\/commons\/(?:thumb\/)?[0-9a-fA-F]\/[0-9a-fA-F]{2}\/([^/]+?)(?:\/\d+px-[^/]+)?$/)
  if (!m) return null
  try { return decodeURIComponent(m[1]) } catch { return m[1] }
}

async function fetchAttribution(imageUrl: string): Promise<Attribution> {
  const file = commonsFileName(imageUrl)
  if (!file) return EMPTY_ATTRIBUTION
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(`File:${file}`)}` +
        `&prop=imageinfo&iiprop=extmetadata&format=json&origin=*`,
      { headers: { 'User-Agent': UA } },
    )
    if (!res.ok) return EMPTY_ATTRIBUTION
    const d = await res.json() as {
      query?: { pages?: Record<string, { imageinfo?: { extmetadata?: Record<string, { value?: string }> }[] }> }
    }
    const meta = Object.values(d.query?.pages ?? {})[0]?.imageinfo?.[0]?.extmetadata ?? {}
    const author = meta.Artist?.value ? stripTags(meta.Artist.value) : null
    const license = meta.LicenseShortName?.value ? stripTags(meta.LicenseShortName.value) : null
    return {
      author: author || null,
      license: license || null,
      sourceUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`,
    }
  } catch {
    return EMPTY_ATTRIBUTION
  }
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
  sourceUrl: string,
  attribution: Attribution,
): Promise<string> {
  // Path includes the source URL so a re-resolve with a different image yields a
  // NEW public URL — clients never serve a stale cached copy after we fix a source.
  const path = `${await sha256hex(`${cacheKey}|${sourceUrl}`)}.${extFor(img.contentType)}`
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
      attribution_author: attribution.author,
      attribution_license: attribution.license,
      attribution_source_url: attribution.sourceUrl,
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
      .select('image_url, source, attribution_author, attribution_license, attribution_source_url')
      .eq('cache_key', cacheKey)
      .maybeSingle()
    if (cached?.image_url) {
      return json({
        uri: cached.image_url,
        source: cached.source,
        reason: 'cache',
        attribution: {
          author: cached.attribution_author,
          license: cached.attribution_license,
          sourceUrl: cached.attribution_source_url,
        },
      })
    }
  } catch { /* fall through to resolve */ }

  const isDomestic = input.isDomestic === true || /^#?D\d/i.test(norm(input.dexNum))

  // Domestic breeds resolve via Wikipedia (a page per breed) → Wikimedia Commons.
  const petKind = petKindFor(commonName, scientificName)
  // Photo sources are Wikipedia + Wikimedia Commons ONLY — both commercial-safe
  // (CC-BY-SA / public domain). iNaturalist (non-commercial photos / not our API)
  // and Google image search (third-party copyright) are intentionally excluded.
  const attempts: { source: string; run: () => Promise<string[]> }[] = isDomestic
    ? [
        { source: 'domestic_registry', run: () => fromDomestic(input) },
        { source: 'database', run: () => fromSpeciesTable(input) },
        // Top Wikipedia breed page (single photo, montages rejected)…
        { source: 'wikipedia', run: () => fromWikipediaSearch(`${commonName} ${petKind} breed`) },
        // …else a single-subject Commons photo of the breed (covers collage breeds).
        { source: 'wikimedia', run: () => fromWikimedia(`${commonName} ${petKind}`) },
      ]
    : [
        { source: 'database', run: () => fromSpeciesTable(input) },
        { source: 'wikipedia', run: () => fromWikipedia(commonName) },
        { source: 'wikipedia', run: () => fromWikipedia(scientificName) },
        { source: 'wikimedia', run: () => fromWikimedia(commonName || scientificName) },
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
      const attribution = await fetchAttribution(url)
      try {
        const stored = await storeAndCache(input, cacheKey, img, attempt.source, url, attribution)
        return json({ uri: stored, source: attempt.source, reason: attempt.source, attribution })
      } catch (e) {
        // storage failed — still return the verified external URL so the UI shows something
        return json({ uri: url, source: attempt.source, reason: `${attempt.source}_nostore`, attribution, warn: String(e) })
      }
    }
  }

  // Nothing resolved — caller shows its category placeholder. NOT cached (retry later).
  return json({ uri: null, source: 'needs_id_placeholder', reason: 'no_image_found' })
})
