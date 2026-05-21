import * as AppleAuthentication from 'expo-apple-authentication'
import { makeRedirectUri } from 'expo-auth-session'
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
  signInWithApple: () => Promise<AuthActionResult>
  signInWithGoogle: () => Promise<AuthActionResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getAuthRedirectUri(): string {
  return makeRedirectUri({
    scheme: 'fauna',
    path: 'auth/callback',
  })
}

async function syncLoggedInFlag(session: Session | null): Promise<void> {
  if (session) {
    await storage.set('isLoggedIn', 'true')
    return
  }
  await storage.delete('isLoggedIn')
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

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    let mounted = true

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) console.warn('[auth] getSession failed:', error.message)
      setSession(data.session)
      void syncLoggedInFlag(data.session).finally(() => {
        if (mounted) setIsLoading(false)
      })
    })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void syncLoggedInFlag(nextSession)
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const signUp = useCallback(async ({ email, password, username }: SignUpParams): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Sign up is unavailable. Supabase is not configured.' }
    }

    const trimmedEmail = email.trim()
    const trimmedUsername = username?.trim()
    if (!trimmedEmail || !password || !trimmedUsername) {
      return { error: 'Please fill in all fields.' }
    }

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

    setSession(data.session)
    await syncLoggedInFlag(data.session)
    return { error: null }
  }, [])

  const signInWithApple = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Apple Sign In is unavailable. Supabase is not configured.' }
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

      setSession(data.session)
      await syncLoggedInFlag(data.session)
      return { error: null }
    } catch (error: unknown) {
      if (isAppleSignInCanceled(error)) return { error: null, canceled: true }
      return { error: 'Apple Sign In failed.' }
    }
  }, [])

  const signInWithGoogle = useCallback(async (): Promise<AuthActionResult> => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return { error: 'Google Sign In is unavailable. Supabase is not configured.' }
    }

    try {
      const redirectTo = getAuthRedirectUri()

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo, skipBrowserRedirect: true },
      })

      if (error || !data.url) {
        return { error: 'Google Sign In failed.' }
      }

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)
      if (result.type !== 'success') return { error: null, canceled: true }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(result.url)
      if (exchangeError) return { error: formatAuthError(exchangeError.message) }

      return { error: null }
    } catch {
      return { error: 'Google Sign In failed.' }
    }
  }, [])

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { error } = await supabase.auth.signOut()
      if (error) console.warn('[auth] signOut failed:', error.message)
    }

    setSession(null)
    await syncLoggedInFlag(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoading,
      isAuthenticated: session != null,
      signUp,
      signIn,
      signInWithApple,
      signInWithGoogle,
      signOut,
    }),
    [isLoading, session, signIn, signInWithApple, signInWithGoogle, signOut, signUp],
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
