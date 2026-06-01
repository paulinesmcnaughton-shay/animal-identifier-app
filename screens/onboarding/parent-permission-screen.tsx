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
import { storage } from '@/util/storage'

function generateToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function ParentPermissionScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [parentName, setParentName] = useState('')
  const [parentEmail, setParentEmail] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const canSubmit = parentName.trim().length > 0 && parentEmail.trim().length > 0 && confirmed

  const handleContinue = async () => {
    if (!canSubmit || loading) return
    setLoading(true)

    const token = generateToken()
    const childUsername = await storage.getString('onboarding.username')

    await Promise.all([
      storage.set('onboarding.parent_name', parentName.trim()),
      storage.set('onboarding.parent_email', parentEmail.trim()),
      storage.set('onboarding.parent_permission_confirmed', 'true'),
      storage.set('onboarding.approval_token', token),
    ])

    const supabase = getSupabaseClient()
    if (supabase) {
      const { error: fnError } = await supabase.functions.invoke('send-parent-approval-email', {
        body: {
          parentEmail: parentEmail.trim(),
          parentName: parentName.trim(),
          childUsername: childUsername ?? undefined,
          token,
        },
      })
      if (fnError && __DEV__) console.error('[WildKind] parent approval email failed:', fnError)
    }

    setLoading(false)
    router.push('/personalize')
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + space[16] }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back to Parent Setup Required"
          onPress={() => router.back()}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Parent Permission
        </Text>
        <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
          We'll send your parent or guardian a confirmation email so they can approve your account.
        </Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Parent or Guardian Name</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="e.g. Jane Smith"
              placeholderTextColor={colors.dim}
              autoCapitalize="words"
              autoCorrect={false}
              value={parentName}
              onChangeText={setParentName}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Parent or Guardian Email</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="parent@example.com"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              value={parentEmail}
              onChangeText={setParentEmail}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="I confirm my parent or guardian has agreed to set up this account"
          onPress={() => setConfirmed((v) => !v)}
          style={styles.checkRow}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Ionicons name="checkmark" size={14} color={colors.card} />}
          </View>
          <Text style={[styles.checkLabel, { fontFamily: 'Nunito_400Regular' }]}>
            I confirm that I am the parent or legal guardian and agree to WildKind's Terms of Use and Privacy Policy.
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
        <View style={[styles.ctaWrap, !canSubmit && styles.ctaWrapDisabled]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={handleContinue}
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
                ]}>Continue</Text>
            }
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space[24] },
  backBtn: { alignSelf: 'flex-start', padding: space[4], marginBottom: space[32] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[8] },
  sub: { fontSize: typeTokens.size.bodyLG, color: colors.dim, lineHeight: 26, marginBottom: space[32] },
  fields: { gap: space[16], marginBottom: space[24] },
  fieldGroup: { gap: space[8] },
  label: {
    fontSize: typeTokens.size.label,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.hairline,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  checkLabel: {
    flex: 1,
    fontSize: typeTokens.size.body,
    color: colors.ink2,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: space[24],
    paddingTop: space[16],
    backgroundColor: colors.bg,
  },
  ctaWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaFaceDisabled: { backgroundColor: '#E4E9EE' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  ctaTextDisabled: { color: colors.switchOff },
})
