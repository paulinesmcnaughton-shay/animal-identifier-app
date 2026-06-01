import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: corsHeaders })

  const { parentEmail, parentName, childUsername, token } = await req.json()

  if (!parentEmail || !token) {
    return new Response(JSON.stringify({ error: 'Missing parentEmail or token' }), { status: 400, headers: corsHeaders })
  }

  const approveUrl = `${SUPABASE_URL}/functions/v1/parent-approval?token=${token}&action=approve`
  const declineUrl = `${SUPABASE_URL}/functions/v1/parent-approval?token=${token}&action=decline`
  const displayName = childUsername ?? 'your child'

  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WildKind Parent Permission</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #FFF8E7; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; }
    .header { background: #1a3d2b; padding: 32px 40px; }
    .header h1 { color: #ffffff; font-size: 22px; margin: 0; letter-spacing: -0.3px; }
    .body { padding: 32px 40px; }
    .body p { color: #33455A; font-size: 16px; line-height: 26px; margin: 0 0 16px; }
    .list { color: #33455A; font-size: 16px; line-height: 26px; padding-left: 20px; margin: 0 0 24px; }
    .list li { margin-bottom: 6px; }
    .actions { display: flex; flex-direction: column; gap: 12px; margin: 32px 0; }
    .btn { display: block; text-align: center; padding: 16px 24px; border-radius: 12px; font-size: 16px; font-weight: 700; text-decoration: none; }
    .btn-approve { background: #1a3d2b; color: #ffffff; }
    .btn-decline { background: #f1f5f9; color: #33455A; border: 1.5px solid #E7EDF3; }
    .footer { padding: 24px 40px; border-top: 1px solid #E7EDF3; }
    .footer p { color: #7388A0; font-size: 13px; line-height: 20px; margin: 0; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>WildKind</h1>
    </div>
    <div class="body">
      <p>Hello${parentName ? ` ${parentName}` : ''},</p>
      <p>
        Your child would like to use WildKind, a nature exploration app that helps identify animals, plants, and other discoveries using photos and location information.
      </p>
      <p>
        Because your child is under 13 years old, WildKind requires permission from a parent or legal guardian before access can be granted.
      </p>
      <p>WildKind may use:</p>
      <ul class="list">
        <li>Photos uploaded by the user</li>
        <li>Approximate location information</li>
        <li>Account information necessary to provide the service</li>
      </ul>
      <p>
        As the parent or guardian, you can review and manage privacy settings, location sharing preferences, and account permissions.
      </p>
      <p>Please choose one of the options below.</p>
      <div class="actions">
        <a href="${approveUrl}" class="btn btn-approve">Approve Access</a>
        <a href="${declineUrl}" class="btn btn-decline">Decline Request</a>
      </div>
    </div>
    <div class="footer">
      <p>If you did not expect this request, you may safely ignore this email.</p>
      <p style="margin-top: 8px;">Thank you,<br />The WildKind Team</p>
    </div>
  </div>
</body>
</html>`

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'WildKind <noreply@wildkind.app>',
      to: [parentEmail],
      subject: `${displayName === 'your child' ? 'Your child' : displayName} would like to use WildKind — parent permission required`,
      html: emailHtml,
    }),
  })

  if (!emailResponse.ok) {
    const err = await emailResponse.text()
    console.error('Resend error:', err)
    return new Response(JSON.stringify({ error: 'Failed to send email' }), { status: 500, headers: corsHeaders })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders })
})
