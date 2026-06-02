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

function buildResetEmail(resetLink: string, displayName: string, username: string | null): string {
  const greeting = `Hello ${displayName},`
  const usernameClause = username
    ? ` (username: <span style="color:#1F3B2D;">${username}</span>)`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="x-apple-disable-message-reformatting">
<title>WildKind — Reset Your Password</title>
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<![endif]-->
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
  body { margin: 0; padding: 0; width: 100% !important; background-color: #F4F2EC; }
  a { color: #1F3B2D; }
  .btn-primary:hover { background-color: #16301F !important; }
  @media only screen and (max-width: 600px) {
    .container { width: 100% !important; }
    .px { padding-left: 28px !important; padding-right: 28px !important; }
    .stack-btn { display: block !important; width: 100% !important; }
    .stack-btn a { display: block !important; text-align: center !important; }
  }
  @media (prefers-color-scheme: dark) {
    body, .body-bg { background-color: #14140F !important; }
    .card { background-color: #1E1E18 !important; box-shadow: 0 1px 3px rgba(0,0,0,0.45) !important; }
    .panel { background-color: #26271F !important; }
    .divider-rule { border-top-color: #33342B !important; }
    .h1 { color: #F1EFE6 !important; }
    .p { color: #C6CDC2 !important; }
    .muted { color: #8C948A !important; }
    .footer-text { color: #79806F !important; }
    .accent { color: #7FB58E !important; }
    .btn-primary { background-color: #3E7A57 !important; color: #0E1611 !important; }
    .preheader { color: #14140F !important; }
  }
</style>
</head>
<body class="body-bg" style="margin:0; padding:0; background-color:#F4F2EC;">

  <!-- Preheader -->
  <div class="preheader" style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all; font-size:1px; line-height:1px; color:#F4F2EC;">
    Reset your WildKind password. This link expires in 30 minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4F2EC;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table role="presentation" class="container card" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:600px; max-width:600px; background-color:#FFFFFF; border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(20,48,31,0.08);">

          <!-- Logo bar -->
          <tr>
            <td class="px" style="padding:34px 48px 22px 48px;" align="left">
              <img src="https://www.wildkind.app/wildkind-logo.png"
                width="150" alt="WildKind" style="width:150px; height:auto; display:block;">
            </td>
          </tr>

          <!-- Hairline rule -->
          <tr>
            <td style="padding:0 48px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td class="divider-rule" style="border-top:1px solid #E7E3D8; font-size:0; line-height:0;">&nbsp;</td></tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td class="px" style="padding:34px 48px 8px 48px;">
              <p class="h1" style="margin:0 0 22px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:18px; line-height:28px; color:#1F2A24;">
                ${greeting}
              </p>
              <p class="p" style="margin:0 0 22px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:16px; line-height:26px; color:#3A463E;">
                We received a request to reset the password for your WildKind account${usernameClause}.
              </p>
              <p class="p" style="margin:0 0 22px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:16px; line-height:26px; color:#3A463E;">
                Tap the button below to choose a new password and get back to exploring the natural world.
              </p>
            </td>
          </tr>

          <!-- Reset button -->
          <tr>
            <td class="px" style="padding:8px 48px 8px 48px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td class="stack-btn">
                    <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
                      href="${resetLink}" style="height:50px;v-text-anchor:middle;width:240px;" arcsize="16%"
                      fillcolor="#1F3B2D" stroke="f">
                      <center style="color:#ffffff;font-family:sans-serif;font-size:15px;font-weight:bold;">Reset Password</center>
                    </v:roundrect><![endif]-->
                    <!--[if !mso]><!-->
                    <a class="btn-primary" href="${resetLink}"
                      style="display:inline-block; background-color:#1F3B2D; color:#FFFFFF;
                      font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                      font-size:15px; font-weight:700; text-align:center; text-decoration:none;
                      padding:15px 44px; border-radius:8px;">Reset Password</a>
                    <!--<![endif]-->
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Expiry panel -->
          <tr>
            <td class="px" style="padding:22px 48px 8px 48px;">
              <table role="presentation" class="panel" width="100%" cellpadding="0" cellspacing="0" border="0"
                style="background-color:#F4F6F2; border-radius:10px;">
                <tr>
                  <td style="padding:18px 26px;">
                    <p class="p" style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                      font-size:15px; line-height:23px; color:#3A463E;">
                      For your security, this link will expire in <strong class="h1" style="color:#1F2A24;">30 minutes</strong> and can only be used once.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td class="px" style="padding:20px 48px 4px 48px;">
              <p class="p" style="margin:0 0 8px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:14px; line-height:22px; color:#3A463E;">
                If the button doesn&rsquo;t work, copy and paste this link into your browser:
              </p>
              <p class="accent" style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:13px; line-height:20px; color:#1F3B2D; word-break:break-all;">
                ${resetLink}
              </p>
            </td>
          </tr>

          <!-- Fine print -->
          <tr>
            <td class="px" style="padding:20px 48px 36px 48px;">
              <p class="muted" style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:13px; line-height:20px; color:#8A938B;">
                If you didn&rsquo;t request a password reset, you can safely ignore this email &mdash; your password won&rsquo;t change.
              </p>
            </td>
          </tr>

        </table>

        <!-- Footer -->
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:600px; max-width:600px;">
          <tr>
            <td class="px" style="padding:24px 48px; text-align:center;">
              <p class="footer-text" style="margin:0 0 6px 0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:12px; line-height:18px; color:#9AA29A;">
                WildKind &middot; Explore the natural world, safely.
              </p>
              <p class="footer-text" style="margin:0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;
                font-size:12px; line-height:18px; color:#9AA29A;">
                Sent because a password reset was requested for your account.
                <a class="accent" href="https://www.wildkind.app/privacy" style="color:#1F3B2D; text-decoration:underline;">Privacy</a>
                &middot;
                <a class="accent" href="https://www.wildkind.app/help" style="color:#1F3B2D; text-decoration:underline;">Help</a>
              </p>
            </td>
          </tr>
        </table>

      </td>
    </tr>
  </table>
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
  let username: string | null = null
  let displayName = 'Explorer'

  if (trimmed.includes('@')) {
    email = trimmed.toLowerCase()
    const { data } = await admin.auth.admin.listUsers()
    const match = data?.users?.find((u: { email?: string; id: string }) => u.email?.toLowerCase() === email)
    if (match) userId = match.id
  } else {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, username, full_name')
      .eq('username', trimmed.toLowerCase())
      .maybeSingle()

    if (profile?.id) {
      userId = profile.id
      username = profile.username ?? null
      displayName = profile.full_name ?? profile.username ?? 'Explorer'
      const { data: authUser } = await admin.auth.admin.getUserById(profile.id)
      email = authUser?.user?.email ?? null
    }
  }

  if (!userId || !email) return json({ success: true })

  // Fetch profile for personalization if we came in via email
  if (!username) {
    const { data: profile } = await admin
      .from('profiles')
      .select('username, full_name')
      .eq('id', userId)
      .maybeSingle()
    if (profile) {
      username = profile.username ?? null
      displayName = profile.full_name ?? profile.username ?? 'Explorer'
    }
  }

  const { data: authUser } = await admin.auth.admin.getUserById(userId)
  const providers = (authUser?.user?.app_metadata?.providers ?? []) as string[]
  const hasPassword = providers.includes('email')

  if (!hasPassword) {
    const provider = providers.includes('google') ? 'google'
      : providers.includes('apple') ? 'apple'
      : 'oauth'
    return json({ success: true, provider })
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email,
    options: { redirectTo: 'https://www.wildkind.app/reset-password' },
  })

  if (linkError || !linkData?.properties?.action_link) {
    console.error('[forgot-password] generateLink failed:', linkError?.message)
    return json({ success: true })
  }

  const resetLink = linkData.properties.action_link

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
      html: buildResetEmail(resetLink, displayName, username),
    }),
  })

  if (!emailRes.ok) {
    console.error('[forgot-password] Resend error:', await emailRes.text())
  }

  return json({ success: true })
})
