import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
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
import { getSupabaseClient } from '@/lib/supabase/client'

export function ResetPasswordScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { access_token, refresh_token } = useLocalSearchParams<{
    access_token?: string
    refresh_token?: string
  }>()

  const [sessionReady, setSessionReady] = useState(false)
  const [sessionError, setSessionError] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  useEffect(() => {
    const supabase = getSupabaseClient()
    if (!supabase) { setSessionError(true); return }

    if (!access_token || !refresh_token) {
      setSessionError(true)
      return
    }

    void supabase.auth.setSession({
      access_token: String(access_token),
      refresh_token: String(refresh_token),
    }).then(({ error: err }) => {
      if (err) { setSessionError(true); return }
      setSessionReady(true)
    })
  }, [access_token, refresh_token])

  const handleSave = async () => {
    if (password.length < 8) { setError('Use at least 8 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); setError('Something went wrong. Please try again.'); return }

    const { error: updateError } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (updateError) { setError(updateError.message); return }

    await supabase.auth.signOut()
    setSaved(true)
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  if (sessionError) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            Link expired
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            This reset link is invalid or has expired. Request a new one from the login screen.
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
          <View style={styles.ctaWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back to log in"
              onPress={() => router.replace('/(onboarding)/login')}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
              <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Back to Log In</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  if (saved) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.centered}>
          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            Password updated
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            Your new password has been saved. Log in with your new password to continue exploring.
          </Text>
        </View>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
          <View style={styles.ctaWrap}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Log in"
              onPress={() => router.replace('/(onboarding)/login')}
              style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
              <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Log In</Text>
            </Pressable>
          </View>
        </View>
      </View>
    )
  }

  if (!sessionReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const canSubmit = password.length >= 8 && confirm.length >= 8

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.fill}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.replace('/(onboarding)/login')}
            style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </Pressable>

          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            New password
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            Choose a strong password for your WildKind account.
          </Text>

          {error && (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { fontFamily: 'Nunito_400Regular' }]}>{error}</Text>
            </View>
          )}

          <View style={styles.fields}>
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>New Password</Text>
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
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={20} color={colors.dim} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Confirm Password</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={[styles.input, styles.inputWithIcon, { fontFamily: 'Nunito_400Regular' }]}
                  placeholder="Re-enter your password"
                  placeholderTextColor={colors.dim}
                  secureTextEntry={!showConfirm}
                  value={confirm}
                  onChangeText={setConfirm}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  onPress={() => setShowConfirm((v) => !v)}
                  style={styles.eyeBtn}>
                  <Ionicons name={showConfirm ? 'eye-off' : 'eye'} size={20} color={colors.dim} />
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
          <View style={[styles.ctaWrap, !canSubmit && styles.ctaWrapDisabled]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save new password"
              onPress={() => void handleSave()}
              disabled={loading || !canSubmit}
              style={({ pressed }) => [
                styles.cta,
                !canSubmit && styles.ctaFaceDisabled,
                pressed && canSubmit && styles.ctaPressed,
              ]}>
              {loading
                ? <ActivityIndicator color={canSubmit ? colors.card : colors.switchOff} />
                : <Text style={[
                    styles.ctaText,
                    { fontFamily: 'BricolageGrotesque_800ExtraBold' },
                    !canSubmit && styles.ctaTextDisabled,
                  ]}>Save Password</Text>
              }
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  inner: { flex: 1 },
  fill: { flex: 1 },
  centered: { flex: 1, paddingHorizontal: space[24], justifyContent: 'center' },
  scroll: { paddingHorizontal: space[24], paddingTop: space[16], paddingBottom: space[16] },
  backBtn: { alignSelf: 'flex-start', padding: space[4], marginBottom: space[32] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[8] },
  sub: { fontSize: typeTokens.size.bodyLG, color: colors.dim, lineHeight: 26, marginBottom: space[24] },
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
  inputWrap: { position: 'relative' },
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
  inputWithIcon: { paddingRight: space[48] },
  eyeBtn: { position: 'absolute', right: space[16], top: 0, bottom: 0, justifyContent: 'center' },
  footer: { paddingHorizontal: space[24], paddingTop: space[16], backgroundColor: colors.bg },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4 },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: space[16], alignItems: 'center', justifyContent: 'center' },
  ctaFaceDisabled: { backgroundColor: '#E4E9EE' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaTextDisabled: { color: colors.switchOff },
})
