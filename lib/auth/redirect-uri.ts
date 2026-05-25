/** Must match Supabase → Authentication → Redirect URLs */
export const SUPABASE_OAUTH_REDIRECT_ALLOWLIST = [
  'wildkind://auth/callback',
  'wildkind://',
] as const

export const WILDKIND_AUTH_REDIRECT_URI = SUPABASE_OAUTH_REDIRECT_ALLOWLIST[0]

/** Always use the app deep link on device — never localhost or exp:// */
export function getAuthRedirectUri(): string {
  return WILDKIND_AUTH_REDIRECT_URI
}

export function logAuthRedirectUri(context: string): void {
  if (!__DEV__) return
  const redirectUri = getAuthRedirectUri()
  console.log(`[WildKind auth] ${context} redirect URI:`, redirectUri)
}
