import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SITE_URL = 'https://wildkind.app/parent-approval'

function redirect(params: Record<string, string>): Response {
  const qs = new URLSearchParams(params).toString()
  return Response.redirect(`${SITE_URL}?${qs}`, 302)
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const action = url.searchParams.get('action')

  if (!token || (action !== 'approve' && action !== 'decline')) {
    return redirect({ status: 'invalid' })
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, username, full_name, parent_approval_status, parent_approval_token_expires_at')
    .eq('parent_approval_token', token)
    .maybeSingle()

  if (error || !profile) {
    if (error) console.error('[parent-approval] lookup failed:', error.message)
    return redirect({ status: 'not-ready' })
  }

  const name = (profile.full_name as string | null) ?? (profile.username as string | null) ?? ''
  const username = (profile.username as string | null) ?? ''

  if (profile.parent_approval_status !== 'pending') {
    const already = profile.parent_approval_status === 'approved' ? 'already-approved' : 'already-declined'
    return redirect({ status: already, name, username })
  }

  if (Date.now() > new Date(profile.parent_approval_token_expires_at as string).getTime()) {
    return redirect({ status: 'expired', name, username })
  }

  await admin.from('profiles').update({
    parent_approval_status: action === 'approve' ? 'approved' : 'declined',
    parent_approval_token: null,
    parent_approval_token_expires_at: null,
  }).eq('id', profile.id)

  if (action === 'decline') {
    await admin.auth.admin.deleteUser(profile.id)
  }

  return redirect({ status: action === 'approve' ? 'approved' : 'declined', name, username })
})
