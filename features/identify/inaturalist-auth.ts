import Constants from 'expo-constants'
import * as AuthSession from 'expo-auth-session'
import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'

import { IdentifyError } from './types'

WebBrowser.maybeCompleteAuthSession()

const API_TOKEN_URL = 'https://www.inaturalist.org/users/api_token'
const OAUTH_ACCESS_KEY = 'wildr.inaturalist.oauth_access'
const JWT_CACHE_KEY = 'wildr.inaturalist.jwt_cache'
const JWT_EXP_KEY = 'wildr.inaturalist.jwt_exp'

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://www.inaturalist.org/oauth/authorize',
  tokenEndpoint: 'https://www.inaturalist.org/oauth/token',
}

function getExtra(key: 'inaturalistClientId' | 'inaturalistClientSecret' | 'inaturalistOAuthToken'): string {
  const value = Constants.expoConfig?.extra?.[key]
  return typeof value === 'string' ? value.trim() : ''
}

function decodeJwtExpiry(jwt: string): number | null {
  const parts = jwt.split('.')
  if (parts.length < 2) return null
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null
  } catch {
    return null
  }
}

export function getInaturalistRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'wildr',
    path: 'oauth/inaturalist',
  })
}

export async function isInaturalistConnected(): Promise<boolean> {
  if (await getCachedJwtIfValid()) return true
  const stored = await SecureStore.getItemAsync(OAUTH_ACCESS_KEY)
  if (stored) return true
  return Boolean(getExtra('inaturalistOAuthToken'))
}

export async function getInaturalistStatusLabel(): Promise<string> {
  const expRaw = await SecureStore.getItemAsync(JWT_EXP_KEY)
  const expMs = expRaw ? Number(expRaw) : null
  if (await getCachedJwtIfValid()) {
    if (expMs) {
      const hours = Math.max(1, Math.round((expMs - Date.now()) / (60 * 60 * 1000)))
      return `Token active · about ${hours}h left`
    }
    return 'Token saved on this device'
  }
  if (await getOAuthAccessToken()) return 'Connected — auto-refresh'
  return 'Paste token from iNaturalist (~24h)'
}

export async function saveInaturalistApiToken(apiToken: string): Promise<void> {
  const jwt = apiToken.trim()
  if (!jwt || jwt.length < 20) {
    throw new IdentifyError('Paste the full token from iNaturalist.', 'NO_TOKEN')
  }
  await cacheJwt(jwt)
}

export async function openInaturalistTokenPage(): Promise<void> {
  await WebBrowser.openBrowserAsync('https://www.inaturalist.org/users/api_token')
}

async function getOAuthAccessToken(): Promise<string | null> {
  const stored = await SecureStore.getItemAsync(OAUTH_ACCESS_KEY)
  if (stored) return stored
  const env = getExtra('inaturalistOAuthToken')
  return env || null
}

async function getCachedJwtIfValid(): Promise<string | null> {
  const jwt = await SecureStore.getItemAsync(JWT_CACHE_KEY)
  if (!jwt) return null
  const expRaw = await SecureStore.getItemAsync(JWT_EXP_KEY)
  const expMs = expRaw ? Number(expRaw) : decodeJwtExpiry(jwt)
  if (expMs && Date.now() >= expMs - 60_000) return null
  return jwt
}

async function cacheJwt(jwt: string): Promise<void> {
  const expMs = decodeJwtExpiry(jwt)
  await SecureStore.setItemAsync(JWT_CACHE_KEY, jwt)
  if (expMs) await SecureStore.setItemAsync(JWT_EXP_KEY, String(expMs))
}

async function fetchJwtFromOAuth(oauthToken: string): Promise<string> {
  const res = await fetch(API_TOKEN_URL, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${oauthToken}`,
    },
  })
  const json = (await res.json()) as { api_token?: string }
  if (!res.ok || !json.api_token) {
    throw new IdentifyError(
      'iNaturalist login expired. Open Settings and connect iNaturalist again.',
      'UNAUTHORIZED',
    )
  }
  return json.api_token
}

export async function resolveInaturalistJwt(fallbackEnvJwt?: string): Promise<string> {
  const cached = await getCachedJwtIfValid()
  if (cached) return cached

  const oauth = await getOAuthAccessToken()
  if (oauth) {
    const jwt = await fetchJwtFromOAuth(oauth)
    await cacheJwt(jwt)
    return jwt
  }

  if (fallbackEnvJwt) {
    const expMs = decodeJwtExpiry(fallbackEnvJwt)
    if (expMs && Date.now() >= expMs - 60_000) {
      throw new IdentifyError(
        'iNaturalist token expired. Settings → iNaturalist → Update token.',
        'TOKEN_EXPIRED',
      )
    }
    return fallbackEnvJwt
  }

  throw new IdentifyError(
    'Settings → iNaturalist → Paste token (from inaturalist.org/users/api_token).',
    'NO_TOKEN',
  )
}

export async function connectInaturalistAccount(): Promise<void> {
  const clientId = getExtra('inaturalistClientId')
  const clientSecret = getExtra('inaturalistClientSecret')
  if (!clientId || !clientSecret) {
    throw new IdentifyError(
      'OAuth app not set up. On iNaturalist tap “Apply to be an App Owner”, or paste your daily token in Settings instead.',
      'NO_TOKEN',
    )
  }

  const redirectUri = getInaturalistRedirectUri()

  const request = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    responseType: AuthSession.ResponseType.Code,
    usePKCE: true,
  })

  const result = await request.promptAsync(discovery)

  if (result.type !== 'success' || !result.params.code) {
    throw new IdentifyError('iNaturalist sign-in was cancelled.', 'UNAUTHORIZED')
  }

  const tokenResponse = await AuthSession.exchangeCodeAsync(
    {
      clientId,
      clientSecret,
      code: result.params.code,
      redirectUri,
      extraParams: {
        code_verifier: request.codeVerifier ?? '',
      },
    },
    discovery,
  )

  if (!tokenResponse.accessToken) {
    throw new IdentifyError('Could not complete iNaturalist sign-in.', 'UNAUTHORIZED')
  }

  await SecureStore.setItemAsync(OAUTH_ACCESS_KEY, tokenResponse.accessToken)
  await SecureStore.deleteItemAsync(JWT_CACHE_KEY)
  await SecureStore.deleteItemAsync(JWT_EXP_KEY)

  const jwt = await fetchJwtFromOAuth(tokenResponse.accessToken)
  await cacheJwt(jwt)
}

export async function disconnectInaturalistAccount(): Promise<void> {
  await SecureStore.deleteItemAsync(OAUTH_ACCESS_KEY)
  await SecureStore.deleteItemAsync(JWT_CACHE_KEY)
  await SecureStore.deleteItemAsync(JWT_EXP_KEY)
}

export async function canUseInaturalistAuth(): Promise<boolean> {
  if (await getCachedJwtIfValid()) return true
  if (await getOAuthAccessToken()) return true
  const envJwt = Constants.expoConfig?.extra?.inaturalistToken
  if (typeof envJwt === 'string' && envJwt.trim()) {
    const expMs = decodeJwtExpiry(envJwt.trim())
    if (!expMs || Date.now() < expMs - 60_000) return true
  }
  return false
}
