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
import { assignNewUserAvatar } from '@/features/settings/profile-avatar'
import { setTesterAccount } from '@/features/settings/tester-account'
import { getUsernameValidationError, sanitizeUsernameInput } from '@/features/settings/username'
import { useAuth } from '@/lib/auth/auth-context'
import { clearPendingOnboarding, storePendingEmailSignup, storePendingOAuthSignup } from '@/lib/onboarding/pending-signup'
import { getSupabaseClient } from '@/lib/supabase/client'
import { DobGateModal } from '@/screens/onboarding/dob-gate-modal'
import { PrivacyTermsModal } from '@/screens/onboarding/privacy-terms-modal'
import { storage } from '@/util/storage'

function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export function SignupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { signInWithApple, signInWithGoogle } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showDobGate, setShowDobGate] = useState(false)
  const [dobGateIsSocial, setDobGateIsSocial] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded
  const canSubmit = username.trim().length > 0 && email.trim().length > 0 && password.length >= 8

  const routeByAge = async (dob: Date) => {
    await setTesterAccount(false)
    await assignNewUserAvatar()
    const age = calculateAge(dob)
    if (age < 13) {
      await storage.set('onboarding.account_type', 'child')
      router.replace('/parent-setup-required')
    } else if (age < 18) {
      await storage.set('onboarding.account_type', 'teen')
      router.replace('/teen-permission')
    } else {
      await storage.set('onboarding.account_type', 'adult')
      router.replace('/personalize')
    }
  }

  const handleEmailSignup = () => {
    if (loading) return
    setError(null)

    const usernameError = getUsernameValidationError(username)
    if (usernameError) { setError(usernameError); return }
    if (!email.trim()) { setError('Please enter your email.'); return }
    if (password.length < 8) { setError('Use at least 8 characters for your password.'); return }

    setShowDobGate(true)
  }

  const handleDobConfirm = async (dob: Date) => {
    setShowDobGate(false)
    await storage.set('onboarding.date_of_birth', dob.toISOString())

    if (dobGateIsSocial) {
      setDobGateIsSocial(false)
      const supabase = getSupabaseClient()
      if (supabase) {
        const { data: { user: authedUser } } = await supabase.auth.getUser()
        if (authedUser) {
          await supabase.from('profiles').upsert(
            { id: authedUser.id, age_verified: true },
            { onConflict: 'id' },
          )
        }
      }
      await routeByAge(dob)
      return
    }

    await storePendingEmailSignup(email, username, password)
    await routeByAge(dob)
  }

  const checkOnboardingAndRoute = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) {
      setDobGateIsSocial(true)
      setShowDobGate(true)
      return
    }
    const { data: { user: authedUser } } = await supabase.auth.getUser()
    if (!authedUser) {
      setDobGateIsSocial(true)
      setShowDobGate(true)
      return
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_complete, age_verified, account_type, parent_approval_status')
      .eq('id', authedUser.id)
      .maybeSingle()

    // Returning user — already fully set up
    if (profile?.onboarding_complete) {
      await clearPendingOnboarding()
      router.replace('/(tabs)/home')
      return
    }

    // Child waiting for or already received approval — resume waiting screen
    if (
      profile?.account_type === 'child' &&
      (profile?.parent_approval_status === 'pending' || profile?.parent_approval_status === 'approved')
    ) {
      router.replace('/(onboarding)/waiting-approval')
      return
    }

    // Age verified but onboarding not finished — resume correct path
    if (profile?.age_verified) {
      if (profile?.account_type === 'child') router.replace('/parent-setup-required')
      else if (profile?.account_type === 'teen') router.replace('/teen-permission')
      else router.replace('/personalize')
      return
    }

    // New user — collect age first
    setDobGateIsSocial(true)
    setShowDobGate(true)
  }

  const handleAppleSignIn = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    await storePendingOAuthSignup()
    const result = await signInWithApple()
    setLoading(false)
    if (result.error) { await clearPendingOnboarding(); setError(result.error); return }
    if (result.canceled) { await clearPendingOnboarding(); return }
    await checkOnboardingAndRoute()
  }

  const handleGoogleSignIn = async () => {
    if (loading) return
    setLoading(true)
    setError(null)
    await storePendingOAuthSignup()
    const result = await signInWithGoogle()
    setLoading(false)
    if (result.error) { await clearPendingOnboarding(); setError(result.error); return }
    if (result.canceled) { await clearPendingOnboarding(); return }
    await checkOnboardingAndRoute()
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <>
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

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Create account</Text>
        <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>Start building your field guide</Text>

        {error && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { fontFamily: 'Nunito_400Regular' }]}>{error}</Text>
          </View>
        )}

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Username</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="e.g. naturelover42"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={(text) => setUsername(sanitizeUsernameInput(text))}
            />
          </View>

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
            <View style={styles.inputWrap}>
              <TextInput
                style={[styles.input, styles.inputWithIcon, { fontFamily: 'Nunito_400Regular' }]}
                placeholder="Min. 8 characters"
                placeholderTextColor={colors.dim}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                onPress={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}>
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.dim}
                />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={[styles.ctaWrap, !canSubmit && styles.ctaWrapDisabled]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            onPress={handleEmailSignup}
            disabled={loading || !canSubmit}
            style={({ pressed }) => [styles.cta, !canSubmit && styles.ctaFaceDisabled, pressed && canSubmit && styles.ctaPressed]}>
            {loading
              ? <ActivityIndicator color={canSubmit ? colors.card : colors.switchOff} />
              : <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }, !canSubmit && styles.ctaTextDisabled]}>Create Account</Text>
            }
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
            onPress={handleAppleSignIn}
            disabled={loading}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, loading && styles.ctaDisabled]}>
            <Ionicons name="logo-apple" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Apple</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={handleGoogleSignIn}
            disabled={loading}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }, loading && styles.ctaDisabled]}>
            <Ionicons name="logo-google" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Google</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in instead"
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.switchText, { fontFamily: 'Nunito_400Regular' }]}>
            Already have an account? <Text style={styles.switchTextBold}>Log In</Text>
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Privacy and Terms"
          onPress={() => setShowPrivacy(true)}
          style={({ pressed }) => [styles.privacyBtn, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.privacyText, { fontFamily: 'Nunito_400Regular' }]}>Privacy & Terms</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>

    <DobGateModal
      visible={showDobGate}
      isLoading={loading}
      onSubmit={handleDobConfirm}
    />
    <PrivacyTermsModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space[24] },
  backBtn: { alignSelf: 'flex-start', padding: space[4] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[8] },
  sub: { fontSize: typeTokens.size.bodyLG, color: colors.dim, marginBottom: space[24] },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
    padding: space[16],
    marginBottom: space[16],
  },
  errorText: { fontSize: typeTokens.size.bodySM, color: '#dc2626' },
  fields: { gap: space[16], marginBottom: space[24] },
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
  inputWrap: { position: 'relative' },
  inputWithIcon: { paddingRight: space[48] },
  eyeBtn: {
    position: 'absolute',
    right: space[16],
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4, marginBottom: space[24] },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: space[16], alignItems: 'center', justifyContent: 'center' },
  ctaFaceDisabled: { backgroundColor: '#E4E9EE' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaTextDisabled: { color: colors.switchOff },
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
  privacyBtn: { alignItems: 'center', paddingVertical: space[8], marginTop: space[4] },
  privacyText: { fontSize: typeTokens.size.caption, color: colors.dim },
})
