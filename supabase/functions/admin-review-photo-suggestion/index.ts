import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Single-admin photo-suggestion review: approve copies the submitted photo
// from the private bucket into the public species-images bucket and caches
// it under the exact key the app's normal resolver (resolve-species-image)
// uses, so it shows up immediately for every user viewing that species.
// Reject just marks the row. The caller must be signed in AS the admin
// account (text4backend@gmail.com) — verified from their own auth token,
// not a separate admin credential.

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const ADMIN_EMAIL = 'text4backend@gmail.com'
const PRIVATE_BUCKET = 'photo-suggestions'
const PUBLIC_BUCKET = 'species-images'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
}

const norm = (s?: string | null): string => (s ?? '').trim()

// MUST match resolve-species-image's buildKey exactly, or an approved photo
// won't be found by the normal resolution path.
function buildCacheKey(row: {
  species_name: string
  latin_name: string | null
  is_domestic: boolean
  kingdom: string | null
  dex_number: string | null
  species_id: string
}): string {
  const category = row.is_domestic ? 'domestic' : (norm(row.kingdom) || 'unknown')
  return [
    norm(row.species_name).toLowerCase(),
    norm(row.latin_name).toLowerCase(),
    category,
    norm(row.dex_number),
    norm(row.species_id),
  ].join('|')
}

async function sha256hex(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const jwt = authHeader.replace(/^Bearer\s+/i, '')
    if (!jwt) return json({ error: 'Sign in required' }, 401)

    const { data: callerData, error: callerError } = await admin.auth.getUser(jwt)
    if (callerError || !callerData?.user) return json({ error: 'Invalid session' }, 401)
    if (callerData.user.email?.toLowerCase() !== ADMIN_EMAIL) return json({ error: 'Not authorized' }, 403)

    const body = await req.json().catch(() => ({}))
    const suggestionId = String(body.suggestionId ?? '')
    const action = body.action === 'reject' ? 'reject' : body.action === 'approve' ? 'approve' : null
    if (!suggestionId || !action) return json({ error: 'suggestionId and action required' }, 400)

    const { data: suggestion, error: fetchError } = await admin
      .from('species_photo_suggestions')
      .select('*')
      .eq('id', suggestionId)
      .maybeSingle()
    if (fetchError || !suggestion) return json({ error: 'Suggestion not found' }, 404)

    if (action === 'reject') {
      await admin
        .from('species_photo_suggestions')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString(), reviewed_by: callerData.user.id })
        .eq('id', suggestionId)
      return json({ status: 'rejected' })
    }

    // Approve: copy the file into the public bucket, cache it, mark reviewed.
    const { data: fileBlob, error: downloadError } = await admin.storage
      .from(PRIVATE_BUCKET)
      .download(suggestion.storage_path)
    if (downloadError || !fileBlob) return json({ error: 'Could not read submitted photo' }, 500)

    const bytes = new Uint8Array(await fileBlob.arrayBuffer())
    const cacheKey = buildCacheKey(suggestion)
    const path = `${await sha256hex(`${cacheKey}|user_submitted|${suggestionId}`)}.jpg`
    const { error: uploadError } = await admin.storage
      .from(PUBLIC_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true })
    if (uploadError) return json({ error: 'Could not publish photo' }, 500)

    const { data: publicUrlData } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path)

    await admin.from('species_image_cache').upsert(
      {
        cache_key: cacheKey,
        common_name: norm(suggestion.species_name) || null,
        scientific_name: norm(suggestion.latin_name) || null,
        kingdom: norm(suggestion.kingdom) || null,
        category: suggestion.is_domestic ? 'domestic' : (norm(suggestion.kingdom) || 'unknown'),
        dex_num: norm(suggestion.dex_number) || null,
        species_id: norm(suggestion.species_id) || null,
        image_url: publicUrlData.publicUrl,
        source: 'user_submitted',
        attribution_author: null,
        attribution_license: null,
        attribution_source_url: null,
      },
      { onConflict: 'cache_key' },
    )

    await admin
      .from('species_photo_suggestions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString(), reviewed_by: callerData.user.id })
      .eq('id', suggestionId)

    return json({ status: 'approved', imageUrl: publicUrlData.publicUrl })
  } catch (e) {
    return json({ error: String(e) }, 500)
  }
})
