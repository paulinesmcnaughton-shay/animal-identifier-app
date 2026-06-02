import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const LOGO = `<div class="logo-bar"><div class="logo-leaf"><svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3C6 3 3 6 3 10c0 2.5 1.5 4.5 3.5 5.5L10 17l3.5-1.5C15.5 14.5 17 12.5 17 10c0-4-3-7-7-7z" fill="#52b788"/><path d="M10 7v6M7 10h6" stroke="#1a3d2b" stroke-width="1.5" stroke-linecap="round"/></svg></div><span class="logo-name">WildKind</span></div>`

const CSS = `*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}.green{background:#1a3d2b}.red{background:#fee2e2}.amber{background:#FFF8E7}.card{background:#fff;border-radius:24px;padding:48px 40px;max-width:460px;width:100%;text-align:center;box-shadow:0 8px 40px rgba(21,33,48,.18)}.logo-bar{display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:32px}.logo-leaf{width:40px;height:40px;background:#1a3d2b;border-radius:50% 50% 50% 8px;display:flex;align-items:center;justify-content:center}.logo-name{font-size:24px;font-weight:800;color:#152130;letter-spacing:-.4px}.icon{font-size:56px;margin-bottom:20px;line-height:1}h1{color:#152130;font-size:26px;font-weight:800;margin-bottom:12px;letter-spacing:-.4px}.explorer{display:inline-block;background:#F0FAF3;border-radius:999px;padding:6px 18px;font-size:15px;font-weight:700;color:#1a3d2b;margin:12px 0 16px}.handle{font-weight:400;color:#7388A0;margin-left:6px;font-size:13px}.sub{color:#33455A;font-size:16px;line-height:26px;margin-bottom:8px}.bg{display:inline-block;border-radius:999px;padding:8px 24px;font-size:14px;font-weight:700;margin:16px 0 20px;letter-spacing:.3px}.g{background:#1a3d2b;color:#fff}.r{background:#fee2e2;color:#dc2626}.y{background:#fef3c7;color:#92400e}.divider{height:1px;background:#E7EDF3;margin:24px 0}.footer{color:#7388A0;font-size:13px;line-height:20px}`

function html(bg: string, icon: string, heading: string, badge: string, body: string, explorer = ''): Response {
  const page = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${heading} — WildKind</title><style>${CSS}</style></head><body class="${bg}"><div class="card">${LOGO}<div class="icon">${icon}</div><h1>${heading}</h1>${explorer}<div class="bg ${badge.split('|')[0]}">${badge.split('|')[1]}</div><p class="sub">${body}</p><div class="divider"></div><p class="footer">You can close this window.</p></div></body></html>`
  const resp = new Response(page)
  resp.headers.set('Content-Type', 'text/html')
  return resp
}

function chip(fullName?: string, username?: string): string {
  if (!fullName && !username) return ''
  return `<div class="explorer">${fullName ?? username}${fullName && username ? `<span class="handle">@${username}</span>` : ''}</div>`
}

Deno.serve(async (req: Request) => {
  const url = new URL(req.url)
  const token = url.searchParams.get('token')
  const action = url.searchParams.get('action')

  if (!token || (action !== 'approve' && action !== 'decline')) {
    return html('amber', '⚠️', 'Invalid Link', 'r|Error', 'This approval link is invalid or malformed.')
  }

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: profile, error } = await admin
    .from('profiles')
    .select('id, username, full_name, parent_approval_status, parent_approval_token_expires_at')
    .eq('parent_approval_token', token)
    .maybeSingle()

  if (error || !profile) {
    return html(
      'amber', '⏳', 'Not Ready Yet', 'y|Setup Incomplete',
      "Your child hasn't finished setting up their WildKind profile yet.<br><br>Once they complete their account setup, ask them to send you a new approval request from inside the app.",
    )
  }

  const fullName = (profile.full_name as string | null) ?? undefined
  const username = (profile.username as string | null) ?? undefined

  if (profile.parent_approval_status !== 'pending') {
    const approved = profile.parent_approval_status === 'approved'
    return html(
      approved ? 'green' : 'red',
      approved ? '✅' : '❌',
      approved ? 'Already Approved' : 'Already Declined',
      approved ? 'g|Access Approved' : 'r|Access Declined',
      `This request has already been ${approved ? 'approved' : 'declined'}.`,
      chip(fullName, username),
    )
  }

  if (Date.now() > new Date(profile.parent_approval_token_expires_at as string).getTime()) {
    return html('amber', '⏰', 'Link Expired', 'y|Expired',
      'This approval link has expired. Please ask your child to send a new permission request from the WildKind app.',
      chip(fullName, username),
    )
  }

  await admin.from('profiles').update({
    parent_approval_status: action === 'approve' ? 'approved' : 'declined',
    parent_approval_token: null,
    parent_approval_token_expires_at: null,
  }).eq('id', profile.id)

  if (action === 'approve') {
    return html(
      'green', '🌿', 'Thank you for keeping WildKind safe!', 'g|Access Approved ✓',
      "You've approved your child's WildKind account. They can now start exploring nature, identifying animals, and building their wild collection.",
      chip(fullName, username),
    )
  }

  return html(
    'red', '❌', 'Request Declined', 'r|Access Declined',
    "You've declined the WildKind access request. Your child's account will not be activated.",
    chip(fullName, username),
  )
})
