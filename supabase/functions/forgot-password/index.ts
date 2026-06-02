import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { identifier } = await req.json() as { identifier: string }
  const trimmed = identifier?.trim()

  // Always return success shape — never reveal whether an account exists
  if (!trimmed) return json({ success: true })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let userId: string | null = null
  let email: string | null = null

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
    // Look up user by email to check their providers
    const { data } = await admin.auth.admin.listUsers()
    const match = data?.users?.find((u) => u.email?.toLowerCase() === email)
    if (match) userId = match.id
  } else {
    const { data: profile } = await admin
      .from('profiles')
      .select('id')
      .eq('username', trimmed.toLowerCase())
      .maybeSingle()

    if (profile?.id) {
      userId = profile.id
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
      email = authUser?.user?.email ?? null
    }
  }

  if (!userId || !email) return json({ success: true })

  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const providers = (authUser?.user?.app_metadata?.providers ?? []) as string[]
  const hasPassword = providers.includes('email')

  // OAuth-only account — tell the client which provider to use
  if (!hasPassword) {
    const provider = providers.includes('google') ? 'google'
      : providers.includes('apple') ? 'apple'
      : 'oauth'
    return json({ success: true, provider })
  }

  await admin.auth.resetPasswordForEmail(email)
  return json({ success: true })
})
