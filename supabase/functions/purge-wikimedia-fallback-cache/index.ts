import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ONE-TIME cleanup: species_image_cache rows resolved via the risky Commons
// keyword-search fallback (source='wikimedia') before resolve-species-image
// preferred scientific name (unambiguous) over common name (has false-friend
// homonyms — e.g. "Platypus" matched a crab species' Commons file instead of
// the mammal). Purges cache + storage objects so they re-resolve cleanly.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
const BUCKET = 'species-images'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(300, Math.max(1, Number(body.limit) || 200))

    const { data: rows, error } = await admin
      .from('species_image_cache')
      .select('cache_key,image_url')
      .eq('source', 'wikimedia')
      .neq('category', 'domestic')
      .limit(limit)
    if (error) return json({ error: error.message }, 500)
    const batch = rows ?? []
    if (batch.length === 0) return json({ purged: 0, done: true })

    const paths = batch
      .map((r) => r.image_url?.match(/\/species-images\/([^/?]+)/)?.[1])
      .filter((p): p is string => !!p)
    if (paths.length) await admin.storage.from(BUCKET).remove(paths)
    await admin.from('species_image_cache').delete().in('cache_key', batch.map((r) => r.cache_key))

    const { count: remaining } = await admin
      .from('species_image_cache')
      .select('cache_key', { count: 'exact', head: true })
      .eq('source', 'wikimedia')
      .neq('category', 'domestic')

    return json({ purged: batch.length, remaining: remaining ?? 0, done: (remaining ?? 0) === 0 })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
