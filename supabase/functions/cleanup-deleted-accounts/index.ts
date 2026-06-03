import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  // Find all accounts whose 90-day window has passed
  const { data: expired, error: fetchError } = await admin
    .from('deleted_accounts')
    .select('original_user_id, storage_prefix')
    .lt('deletion_scheduled_for', new Date().toISOString())

  if (fetchError) {
    console.error('[cleanup] fetch failed:', fetchError.message)
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...cors, 'Content-Type': 'application/json' },
    })
  }

  const results: { userId: string; ok: boolean; error?: string }[] = []

  for (const account of (expired ?? [])) {
    const userId = account.original_user_id
    const prefix = account.storage_prefix

    try {
      // Delete all sighting photos from Storage
      const { data: files } = await admin.storage
        .from('sighting-photos')
        .list(userId, { limit: 1000 })

      if (files && files.length > 0) {
        const paths = files.map((f: { name: string }) => `${prefix}${f.name}`)
        await admin.storage.from('sighting-photos').remove(paths)
      }

      // Hard delete the auth user — cascades to profiles and user_sightings
      const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
      if (deleteError) throw new Error(deleteError.message)

      // Clean up the deleted_accounts record
      await admin.from('deleted_accounts').delete().eq('original_user_id', userId)

      results.push({ userId, ok: true })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[cleanup] failed for ${userId}:`, message)
      results.push({ userId, ok: false, error: message })
    }
  }

  return new Response(
    JSON.stringify({ cleaned: results.filter((r) => r.ok).length, results }),
    { headers: { ...cors, 'Content-Type': 'application/json' } },
  )
})
