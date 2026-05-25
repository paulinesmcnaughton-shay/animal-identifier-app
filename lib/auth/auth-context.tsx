import * as AppleAuthentication from 'expo-apple-authentication'
import * as WebBrowser from 'expo-web-browser'
import type { Session, User } from '@supabase/supabase-js'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { ensureUserAvatar, resetTesterAvatarForNextSession } from '@/features/settings/profile-avatar'
import { getUsernameValidationError, normalizeUsername } from '@/features/settings/username'
import { syncAccountProfileFromAuth } from '@/features/settings/sync-account-profile'
import { syncTesterAccountFromEmail } from '@/features/settings/tester-account'
import {
  clearStaleOAuthPkceState,
  completeOAuthSessionFromUrl,
  isWildKindAuthCallbackUrl,
} from '@/lib/auth/complete-oauth-session'
import {
  deactivateDemoSession,
  isDemoSessionActive,
  restoreDemoSession,
  activateDemoSession,
} from '@/lib/auth/demo-session'
import { getAuthRedirectUri, logAuthRedirectUri } from '@/lib/auth/redirect-uri'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

WebBrowser.maybeCompleteAuthSession()

interface SignUpParams {
  email: string
  password: string
  username?: string
}

interface SignInParams {
  email: string
  password: string
}

interface AuthActionResult {
  error: string | null
  needsEmailConfirmation?: boolean
  canceled?: boolean
}

interface AuthContextValue {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
  signUp: (params: SignUpParams) => Promise<AuthActionResult>
  signIn: (params: SignInParams) => Promise<AuthActionResult>
  signInAsDemoUser: () => Promise<AuthActionResult>
  signInWithApple: () => Promise<AuthActionResult>
  signInWithGoogle: () => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function syncLoggedInFlag(session: Session | null): Promise<void> {
  if (session) {
    await storage.set('isLoggedIn', 'true')
    if (session.user.email) {
      await storage.set('auth.userEmail', session.user.email.trim().toLowerCase())
    }
    return
  }
  await storage.delete('isLoggedIn')
  await storage.delete('auth.userEmail')
}

function formatAuthError(message: string): string {
  return message.replace(/^AuthApiError:\s*/i, '').trim()
}

function isAppleSignInCanceled(error: unknown): boolean {
  return (
    typeof error === 'object'
    && error !== null
    && 'code' in error
    && (error as { code?: string }).code === 'ERR_REQUEST_CANCELED'
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const commitAuthenticatedSession = useCallback(async (nextSession: Session) => {
    await deactivateDemoSession()
    await syncTesterAccountFromEmail(nextSession.user.email)
    setSession(nextSession)
    await syncLoggedInFlag(nextSession)
    try {
      await syncAccountProfileFromAuth(nextSession.user)
    } catch (error) {
      if (__DEV__) console.warn('[WildKind] profile sync failed:', error)
    }
    await ensureUserAvatar(nextSession.user.email)
  }, [])

  const handleAuthSessionChange = useCallback(
    async (event: string, nextSession: Session | null) => {
      if (nextSession) {
        setSession(nextSession)
        await syncLoggedInFlag(nextSession)

        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          try {
            await syncAccountProfileFromAuth(nextSession.user)
          } catch (error) {
            if (__DEV__) console.warn('[WildKind] profile sync failed:', error)
          }
          await ensureUserAvatar(nextSession.user.email)
        }
        return
      }

      const demoSession = await restoreDemoSession()
      setSession(demoSession)
      await syncLoggedInFlag(demoSession)
      if (demoSession?.user?.email) {
        await ensureUserAvatar(demoSession.user.email)
      }
    },
    [],
  )

  useEffect(() => {
    const supabase = getSupabaseClient()
    let mounted = true

    const finishLoading = () => {
      if (mounted) setIsLoading(false)
    }

    if (!supabase) {
      void restoreDemoSession().then((demoSession) => {
        if (!mounted) return
        setSession(demoSession)
        void syncLoggedInFlag(demoSession).finally(finishLoading)
        if (demoSession?.user?.email) {
          void ensureUserAvatar(demoSession.user.email)
        }
      })
      return () => {
        mounted = false
      }
    }

    void supabase.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return
      if (error) console.warn('[auth] getSession failed:', error.message)

      const demoSession = data.session ? null : await restoreDemoSession()
      const activeSession = data.session ?? demoSession
      setSession(activeSession)

      void syncLoggedInFlag(activeSession).finally(() => {
        if (mounted) setIsLoading(false)
      })

      if (activeSession?.user) {
        try {
          await syncAccountProfileFromAuth(activeSession.user)
        } catch (error) {
          if (__DEV__) console.warn('[WildKind] profile sync failed:', error)
        }
        await ensureUserAvatar(activeSession.user.email)
      } else if (mounted) {
        setIsLoading(false)
      }
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void handleAuthSessionChange(event, nextSession)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [commitAuthenticatedSession, handleAuthSessionChange])

  const signUp = useCallback(async ({ email, password, username }: SignUpParams): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Sign up is unavailable. Supabase is not configured.' }
    }

    const trimmedEmail = email.trim()
    const trimmedUsername = username ? normalizeUsername(username) : ''
    if (!trimmedEmail || !password || !trimmedUsername) {
      return { error: 'Please fill in all fields.' }
    }

    const usernameError = getUsernameValidationError(trimmedUsername)
    if (usernameError) return { error: usernameError }

    if (password.length < 8) {
      return { error: 'Use at least 8 characters for your password.' }
    }

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: { data: { username: trimmedUsername } },
    })

    if (error) return { error: formatAuthError(error.message) }

    setSession(data.session)
    await syncLoggedInFlag(data.session)

    if (!data.session) {
      return { error: null, needsEmailConfirmation: true }
    }

    return { error: null }
  }, [])

  const signInAsDemoUser = useCallback(async (): Promise<AuthActionResult> => {
    if (!__DEV__) {
      return { error: 'Demo login is only available while testing in development.' }
    }

    const demoSession = await activateDemoSession()
    await syncTesterAccountFromEmail(demoSession.user.email)
    setSession(demoSession)
    await syncLoggedInFlag(demoSession)
    await ensureUserAvatar(demoSession.user.email)
    return { error: null }
  }, [])

  const signIn = useCallback(async ({ email, password }: SignInParams): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Log in is unavailable. Supabase is not configured.' }
    }

    const trimmedEmail = email.trim()
    if (!trimmedEmail || !password) {
      return { error: 'Email and password are required.' }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    })

    if (error) return { error: formatAuthError(error.message) }

    await commitAuthenticatedSession(data.session)
    return { error: null }
  }, [commitAuthenticatedSession])

  const signInWithApple = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Apple Sign In is unavailable. Supabase is not configured.' }
    }

    const isAvailable = await AppleAuthentication.isAvailableAsync()
    if (!isAvailable) {
      return { error: 'Sign in with Apple is not available on this device.' }
    }

    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })

      if (!credential.identityToken) {
        return { error: 'Apple Sign In failed.' }
      }

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
      })

      if (error) return { error: formatAuthError(error.message) }

      await commitAuthenticatedSession(data.session)
      return { error: null }
    } catch (error: unknown) {
      if (isAppleSignInCanceled(error)) return { error: null, canceled: true }
      return { error: 'Apple Sign In failed.' }
    }
  }, [commitAuthenticatedSession])

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Google Sign In is unavailable. Supabase is not configured.' }
    }

    try {
      await clearStaleOAuthPkceState()

      const redirectTo = getAuthRedirectUri()
      logAuthRedirectUri('Google')

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })

      if (error || !data.url) {
        return { error: error ? formatAuthError(error.message) : 'Google Sign In failed.' }
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type !== 'success') return { error: null, canceled: true }

      if (!isWildKindAuthCallbackUrl(result.url)) {
        if (__DEV__) console.warn('[WildKind auth] Unexpected OAuth callback URL:', result.url)
        return {
          error: 'Google sign-in opened the wrong page (localhost). Reload the app and try again.',
        }
      }

      const { session: oauthSession, error: oauthError } = await completeOAuthSessionFromUrl(
        supabase,
        result.url,
      )
      if (oauthError) {
        return { error: formatAuthError(oauthError) }
      }

      if (oauthSession) {
        await commitAuthenticatedSession(oauthSession)
      }

      return { error: null }
    } catch {
      return { error: 'Google Sign In failed.' }
    }
  }, [commitAuthenticatedSession])

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient()
    const email = session?.user?.email
    const isDemo = await isDemoSessionActive()

    if (!isDemo && supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('[auth] signOut failed:', error.message)
    }

    if (isDemo) {
      await deactivateDemoSession()
    }

    setSession(null)
    await syncLoggedInFlag(null)

    if (email) {
      await syncTesterAccountFromEmail(email)
      await resetTesterAvatarForNextSession()
    }
  }, [session?.user?.email])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: session != null,
      signUp,
      signIn,
      signInAsDemoUser,
      signInWithApple,
      signInWithGoogle,
      signOut,
    }),
    [isLoading, session, signIn, signInAsDemoUser, signInWithApple, signInWithGoogle, signOut, signUp],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
