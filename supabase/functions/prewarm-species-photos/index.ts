import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Resumable batch that pre-resolves catalog photos. For each unchecked species it
// calls resolve-species-image (which fetches Wikipedia/Wikimedia, verifies, stores
// our owned copy, and caches it WITH CC attribution), then records coverage on the
// species row (has_photo + image_checked_at). It does NOT write species.image_url —
// the cache stays the source so the attribution credit is preserved.
//
// Drive it page-by-page until remaining = 0.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
const RESOLVE_URL = `${SUPABASE_URL}/functions/v1/resolve-species-image`
const CONCURRENCY = 10

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

interface SpeciesRow {
  id: string
  slug: string | null
  common_name: string
  latin_name: string | null
  kingdom: string | null
  dex_number: string | null
}

async function resolveOne(s: SpeciesRow): Promise<boolean> {
  try {
    const res = await fetch(RESOLVE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_ROLE}`,
        apikey: SERVICE_ROLE,
      },
      body: JSON.stringify({
        commonName: s.common_name,
        scientificName: s.latin_name,
        kingdom: s.kingdom,
        dexNum: s.dex_number,
        speciesId: s.slug,
      }),
    })
    if (!res.ok) return false
    const data = await res.json().catch(() => null)
    return typeof data?.uri === 'string' && data.uri.length > 0
  } catch {
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(120, Math.max(1, Number(body.limit) || 50))

    const { data: rows, error } = await admin
      .from('species')
      .select('id,slug,common_name,latin_name,kingdom,dex_number')
      .is('image_checked_at', null)
      .order('dex_number', { ascending: true })
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    const batch: SpeciesRow[] = rows ?? []
    if (batch.length === 0) {
      const { count } = await admin.from('species').select('id', { count: 'exact', head: true }).is('image_checked_at', null)
      return json({ processed: 0, found: 0, remaining: count ?? 0, done: true })
    }

    let found = 0
    const checkedAt = new Date().toISOString()
    for (let i = 0; i < batch.length; i += CONCURRENCY) {
      const slice = batch.slice(i, i + CONCURRENCY)
      const results = await Promise.all(slice.map(resolveOne))
      await Promise.all(
        slice.map((s, j) =>
          admin.from('species').update({ has_photo: results[j], image_checked_at: checkedAt }).eq('id', s.id),
        ),
      )
      found += results.filter(Boolean).length
    }

    const { count: remaining } = await admin
      .from('species')
      .select('id', { count: 'exact', head: true })
      .is('image_checked_at', null)
    return json({ processed: batch.length, found, remaining: remaining ?? 0, done: (remaining ?? 0) === 0 })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
