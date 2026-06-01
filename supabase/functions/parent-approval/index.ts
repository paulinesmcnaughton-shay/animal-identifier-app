import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function htmlPage(title: string, heading: string, body: string, color = '#1a3d2b'): Response {
  return new Response(
    `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — WildKind</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFF8E7; margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { background: #fff; border-radius: 20px; padding: 48px 40px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(21,33,48,0.08); }
    .icon { font-size: 56px; margin-bottom: 24px; }
    h1 { color: #152130; font-size: 26px; margin: 0 0 16px; }
    p { color: #33455A; font-size: 16px; line-height: 26px; margin: 0 0 12px; }
    .badge { display: inline-block; background: ${color}18; color: ${color}; border-radius: 999px; padding: 6px 16px; font-size: 14px; font-weight: 600; margin-bottom: 24px; }
    .footer { color: #7388A0; font-size: 13px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${color === '#1a3d2b' ? '✅' : '❌'}</div>
    <h1>${heading}</h1>
    <div class="badge">${title}</div>
    <p>${body}</p>
    <p class="footer">You can close this window.</p>
  </div>
</body>
</html>`,
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}

serve(async (req) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const action = url.searchParams.get('action')

  if (!token || (action !== 'approve' && action !== 'decline')) {
    return htmlPage('Invalid Request', 'Invalid Link', 'This approval link is invalid or malformed.', '#dc2626')
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, parent_approval_status, parent_approval_token_expires_at')
    .eq('parent_approval_token', token)
    .maybeSingle()

  if (error || !profile) {
    return htmlPage(
      'Not Ready Yet',
      'Setup Not Complete',
      "Your child hasn't finished setting up their WildKind account yet. Once they complete the setup steps, this link will activate. Please check back in a few minutes.",
      '#f59e0b',
    )
  }

  if (profile.parent_approval_status !== 'pending') {
    const already = profile.parent_approval_status === 'approved' ? 'already approved' : 'already declined'
    return htmlPage('Already Responded', 'Request Already Handled', `This request has been ${already}.`)
  }

  const expires = new Date(profile.parent_approval_token_expires_at)
  if (Date.now() > expires.getTime()) {
    return htmlPage('Link Expired', 'This Link Has Expired', 'This approval link has expired. Please ask your child to send a new permission request.', '#dc2626')
  }

  const newStatus = action === 'approve' ? 'approved' : 'declined'

  await admin
    .from('profiles')
    .update({
      parent_approval_status: newStatus,
      parent_approval_token: null,
      parent_approval_token_expires_at: null,
    })
    .eq('id', profile.id)

  if (action === 'approve') {
    return htmlPage(
      'Access Approved',
      'Access Approved',
      'You have approved access to WildKind. Your child can now start exploring.',
    )
  }

  return htmlPage(
    'Request Declined',
    'Request Declined',
    'You have declined the WildKind access request. Your child\'s account has not been created.',
    '#dc2626',
  )
})
