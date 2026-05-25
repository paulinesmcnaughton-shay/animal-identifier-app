import AsyncStorage from '@react-native-async-storage/async-storage'
import { getQueryParams } from 'expo-auth-session/build/QueryParams'
import type { Session, SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseUrl } from '@/lib/supabase/config'
import { WILDKIND_AUTH_REDIRECT_URI } from '@/lib/auth/redirect-uri'

export function isWildKindAuthCallbackUrl(url: string): boolean {
  return url.startsWith(WILDKIND_AUTH_REDIRECT_URI) || url.startsWith('wildkind://')
}

function getPkceVerifierStorageKey(): string {
  const ref = getSupabaseUrl().match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
  return ref ? `sb-${ref}-auth-token-code-verifier` : 'sb-auth-token-code-verifier'
}

/** Clears a half-finished OAuth attempt so the next Google sign-in starts clean. */
export async function clearStaleOAuthPkceState(): Promise<void> {
  await AsyncStorage.removeItem(getPkceVerifierStorageKey())
}

export async function completeOAuthSessionFromUrl(
  supabase: SupabaseClient,
  url: string,
): Promise<{ session: Session | null; error: string | null }> {
  const { params, errorCode } = getQueryParams(url)

  if (errorCode) {
    return { session: null, error: errorCode }
  }

  if (params.error_description) {
    return { session: null, error: params.error_description }
  }

  if (params.error) {
    return { session: null, error: params.error }
  }

  const accessToken = params.access_token
  if (accessToken) {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: params.refresh_token ?? '',
    })
    if (error) return { session: null, error: error.message }
    return { session: data.session, error: null }
  }

  const authCode = params.code
  if (authCode) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(authCode)
    if (error) return { session: null, error: error.message }
    return { session: data.session, error: null }
  }

  return { session: null, error: 'Google sign-in did not return a code. Try again.' }
}
