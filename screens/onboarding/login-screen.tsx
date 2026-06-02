import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { useAuth } from '@/lib/auth/auth-context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

async function routeAfterAuth(router: ReturnType<typeof useRouter>): Promise<void> {
  const supabase = getSupabaseClient()

  if (!supabase) {
    Alert.alert('Please try again', 'We could not check your account setup. Please check your connection and try again.')
    return
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { router.replace('/(onboarding)/welcome'); return }

  const { data: profile } = await supabase
    .from('profiles')
    .select('onboarding_complete')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.onboarding_complete === true) {
    await storage.set('profile.onboarding_complete', 'true')
    router.replace('/home')
    return
  }

  await Promise.all([
    storage.set('onboarding.pending', 'true'),
    storage.set('onboarding.method', 'oauth'),
  ])
  router.replace('/personalize')
}

export function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { signIn, signInWithApple, signInWithGoogle } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [resetError, setResetError] = useState<string | null>(null)
  const [resetOAuthProvider, setResetOAuthProvider] = useState<'google' | 'apple' | 'oauth' | null>(null)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleLogin = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const { error } = await signIn({ email, password })
    setIsSubmitting(false)
    if (error) { Alert.alert('Could not log in', error); return }
    await routeAfterAuth(router)
  }

  const handleAppleSignIn = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const result = await signInWithApple()
    setIsSubmitting(false)
    if (result.error) { Alert.alert('Apple Sign In failed', result.error); return }
    if (result.canceled) return
    await routeAfterAuth(router)
  }

  const handleGoogleSignIn = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const result = await signInWithGoogle()
    setIsSubmitting(false)
    if (result.error) { Alert.alert('Google Sign In failed', result.error); return }
    if (result.canceled) return
    await routeAfterAuth(router)
  }

  const handleShowReset = () => {
    setResetEmail(email)
    setResetSent(false)
    setResetError(null)
    setResetOAuthProvider(null)
    setShowReset(true)
  }

  const handleSendReset = async () => {
    const trimmed = resetEmail.trim()
    if (!trimmed) { setResetError('Please enter your email address.'); return }
    setResetLoading(true)
    setResetError(null)
    const supabase = getSupabaseClient()
    if (!supabase) { setResetLoading(false); setResetError('Something went wrong. Please try again.'); return }
    const { data, error } = await supabase.functions.invoke('forgot-password', { body: { identifier: trimmed } })
    setResetLoading(false)
    if (error) { setResetError('Something went wrong. Please try again.'); return }
    if (data?.provider) {
      setResetOAuthProvider(data.provider as 'google' | 'apple' | 'oauth')
    } else {
      setResetSent(true)
    }
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  if (showReset) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.resetRoot, { paddingTop: insets.top }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => setShowReset(false)}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>

          {resetOAuthProvider ? (
            <>
              <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
                {resetOAuthProvider === 'google' ? 'You signed up with Google'
                  : resetOAuthProvider === 'apple' ? 'You signed up with Apple'
                  : 'You used social sign-in'}
              </Text>
              <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
                {resetOAuthProvider === 'google'
                  ? 'Your account is linked to Google. No separate password needed — tap Continue with Google on the login screen.'
                  : resetOAuthProvider === 'apple'
                  ? 'Your account is linked to Apple. No separate password needed — tap Continue with Apple on the login screen.'
                  : 'Your account uses social sign-in. Use the Apple or Google button on the login screen.'}
              </Text>
              <View style={styles.ctaWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to log in"
                  onPress={() => setShowReset(false)}
                  style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Back to Log In</Text>
                </Pressable>
              </View>
            </>
          ) : resetSent ? (
            <>
              <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
                Check your email
              </Text>
              <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
                If an account exists for that email or username, we've sent a reset link. Check your inbox and follow the link to set a new password.
              </Text>
              <View style={styles.ctaWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to log in"
                  onPress={() => setShowReset(false)}
                  style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
                  <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Back to Log In</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
                Reset password
              </Text>
              <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
                Enter your email or username. We'll send a reset link to the email on your account.
              </Text>

              {resetError && (
                <View style={styles.errorBox}>
                  <Text style={[styles.errorText, { fontFamily: 'Nunito_400Regular' }]}>{resetError}</Text>
                </View>
              )}

              <View style={[styles.fields, { marginBottom: space[24] }]}>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Email or Username</Text>
                  <TextInput
                    style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
                    placeholder="you@example.com or naturelover42"
                    placeholderTextColor={colors.dim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    autoFocus
                  />
                </View>
              </View>

              <View style={styles.ctaWrap}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Send reset link"
                  onPress={() => void handleSendReset()}
                  disabled={resetLoading}
                  style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, resetLoading && styles.ctaDisabled]}>
                  {resetLoading
                    ? <ActivityIndicator color={colors.card} />
                    : <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Send Reset Link</Text>
                  }
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space[16], paddingBottom: insets.bottom + space[40] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={[styles.backBtn, { marginBottom: space[32] }]}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Welcome back</Text>
        <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>Log in to your WildKind account</Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Email</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="you@example.com"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Password</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="Your password"
              placeholderTextColor={colors.dim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              onPress={handleShowReset}
              style={({ pressed }) => [styles.forgotBtn, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.forgotText, { fontFamily: 'Nunito_400Regular' }]}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log in"
            onPress={() => void handleLogin()}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, isSubmitting && styles.ctaDisabled]}>
            <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
              {isSubmitting ? 'Logging in…' : 'Log In'}
            </Text>
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={[styles.dividerText, { fontFamily: 'Nunito_400Regular' }]}>or continue with</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.socialRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Apple"
            onPress={() => void handleAppleSignIn()}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, isSubmitting && styles.ctaDisabled]}>
            <Ionicons name="logo-apple" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Apple</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={() => void handleGoogleSignIn()}
            disabled={isSubmitting}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, isSubmitting && styles.ctaDisabled]}>
            <Ionicons name="logo-google" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Google</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create an account instead"
          onPress={() => router.replace('/signup')}
          style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.switchText, { fontFamily: 'Nunito_400Regular' }]}>
            Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  resetRoot: { flex: 1, paddingHorizontal: space[24] },
  scroll: { paddingHorizontal: space[24] },
  backBtn: { alignSelf: 'flex-start', padding: space[4], marginBottom: space[32] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[8] },
  sub: { fontSize: typeTokens.size.bodyLG, color: colors.dim, marginBottom: space[24] },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
    padding: space[16],
    marginBottom: space[16],
  },
  errorText: { fontSize: typeTokens.size.bodySM, color: '#dc2626' },
  fields: { gap: space[16] },
  fieldGroup: { gap: space[8] },
  label: { fontSize: typeTokens.size.label, color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    fontSize: typeTokens.size.bodyLG,
    color: colors.ink,
  },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: space[4] },
  forgotText: { fontSize: typeTokens.size.bodySM, color: colors.green },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4, marginBottom: space[24] },
  cta: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: space[16], alignItems: 'center', justifyContent: 'center' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: space[16], marginBottom: space[16] },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.hairline },
  dividerText: { fontSize: typeTokens.size.bodySM, color: colors.dim },
  socialRow: { flexDirection: 'row', gap: space[16], marginBottom: space[24] },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: space[8], backgroundColor: colors.card, borderWidth: 1.5,
    borderColor: colors.hairline, borderRadius: radius.lg, paddingVertical: space[16],
  },
  socialText: { fontSize: typeTokens.size.body, color: colors.ink },
  switchBtn: { alignItems: 'center', paddingVertical: space[8] },
  switchText: { fontSize: typeTokens.size.body, color: colors.dim },
  switchTextBold: { color: colors.green, fontWeight: typeTokens.body.weights.bold },
})
