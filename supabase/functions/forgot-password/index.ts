import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const RESEND_FROM_EMAIL = Deno.env.get('RESEND_FROM_EMAIL') ?? 'noreply@wildkind.app'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: object) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function buildResetEmail(resetLink: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Reset your WildKind password</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFF8E7; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: #1a3d2b; padding: 32px 40px; display: flex; align-items: center; gap: 12px; }
    .logo-leaf {
      width: 36px; height: 36px; background: #52b788;
      border-radius: 50% 50% 50% 8px;
      display: inline-flex; align-items: center; justify-content: center;
    }
    .logo-name { color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.3px; margin: 0; }
    .body { padding: 36px 40px; }
    .body p { color: #33455A; font-size: 16px; line-height: 26px; margin: 0 0 16px; }
    .cta-wrap { margin: 32px 0; }
    .cta {
      display: inline-block;
      background: #1a3d2b;
      color: #ffffff;
      text-decoration: none;
      font-size: 16px;
      font-weight: 700;
      padding: 16px 32px;
      border-radius: 12px;
      letter-spacing: 0.3px;
    }
    .divider { height: 1px; background: #E7EDF3; margin: 24px 0; }
    .link-fallback { color: #7388A0; font-size: 13px; line-height: 20px; word-break: break-all; }
    .link-fallback a { color: #52b788; }
    .footer { padding: 24px 40px; border-top: 1px solid #E7EDF3; }
    .footer p { color: #7388A0; font-size: 13px; line-height: 20px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo-leaf">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 3C6 3 3 6 3 10c0 2.5 1.5 4.5 3.5 5.5L10 17l3.5-1.5C15.5 14.5 17 12.5 17 10c0-4-3-7-7-7z" fill="#1a3d2b"/>
          <path d="M10 7v6M7 10h6" stroke="#52b788" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="logo-name">WildKind</p>
    </div>
    <div class="body">
      <p>Hi Explorer,</p>
      <p>We received a request to reset the password for your WildKind account. Click the button below to choose a new password.</p>
      <div class="cta-wrap">
        <a href="${resetLink}" class="cta">Reset Password</a>
      </div>
      <p>This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email — your account is still secure.</p>
      <div class="divider"></div>
      <p class="link-fallback">If the button above doesn't work, copy and paste this link into your browser:<br /><a href="${resetLink}">${resetLink}</a></p>
    </div>
    <div class="footer">
      <p>Thank you,<br />The WildKind Team</p>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const { identifier } = await req.json() as { identifier: string }
  const trimmed = identifier?.trim()

  if (!trimmed) return json({ success: true })

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  let userId: string | null = null
  let email: string | null = null

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
    const { data } = await admin.auth.admin.listUsers()
    const match = data?.users?.find((u: { email?: string; id: string }) => u.email?.toLowerCase() === email)
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

  if (!hasPassword) {
    const provider = providers.includes('google') ? 'google'
      : providers.includes('apple') ? 'apple'
      : 'oauth'
    return json({ success: true, provider })
  }

  // Generate the reset link via Supabase (handles token creation)
  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://wildkind.app/reset-password' },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[forgot-password] generateLink failed:', linkError?.message)
    return json({ success: true })
  }

  const resetLink = linkData.properties.action_link

  // Send branded email via Resend
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `WildKind <${RESEND_FROM_EMAIL}>`,
      to: [email],
      subject: 'Reset your WildKind password',
      html: buildResetEmail(resetLink),
    }),
  })

  if (!emailRes.ok) {
    console.error('[forgot-password] Resend error:', await emailRes.text())
  }

  return json({ success: true })
})
