import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
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
import { syncAccountProfileFromAuth } from '@/features/settings/sync-account-profile'
import { useAuth } from '@/lib/auth/auth-context'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

type ApprovalStatus = 'pending' | 'approved' | 'declined'

function generateToken(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export function WaitingApprovalScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user } = useAuth()

  const [status, setStatus] = useState<ApprovalStatus>('pending')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)

  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newParentName, setNewParentName] = useState('')
  const [newParentEmail, setNewParentEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  const [changeEmailSuccess, setChangeEmailSuccess] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user) return
    const supabase = getSupabaseClient()
    if (!supabase) return

    const fetchStatus = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('parent_approval_status')
        .eq('id', user.id)
        .maybeSingle()
      const next = data?.parent_approval_status
      if (next === 'pending' || next === 'approved' || next === 'declined') setStatus(next)
    }

    void fetchStatus()

    const channel = supabase
      .channel(`approval-${user.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${user.id}` },
        (payload) => {
          const next = (payload.new as { parent_approval_status?: string }).parent_approval_status
          if (next === 'pending' || next === 'approved' || next === 'declined') setStatus(next)
        },
      )
      .subscribe()

    pollRef.current = setInterval(() => void fetchStatus(), 30_000)

    return () => {
      void supabase.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [user])

  const handleStartExploring = async () => {
    if (status !== 'approved' || !user) return
    setLoading(true)
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    await supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id)
    await storage.set('profile.onboarding_complete', 'true')
    await syncAccountProfileFromAuth(user)
    router.replace('/home')
  }

  const handleResend = async () => {
    if (resending || !user) return
    setResending(true)
    setResendSuccess(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setResending(false); return }

    const { data: profile } = await supabase
      .from('profiles')
      .select('parent_email, parent_name, username, full_name, parent_approval_token')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.parent_email && profile?.parent_approval_token) {
      await supabase.functions.invoke('send-parent-approval-email', {
        body: {
          parentEmail: profile.parent_email,
          parentName: profile.parent_name,
          childUsername: profile.username,
          childFullName: profile.full_name ?? undefined,
          token: profile.parent_approval_token,
        },
      })
    }
    setResending(false)
    setResendSuccess(true)
  }

  const handleChangeEmail = async () => {
    if (!newParentEmail.trim() || changingEmail || !user) return
    setChangingEmail(true)
    setChangeEmailSuccess(false)
    const supabase = getSupabaseClient()
    if (!supabase) { setChangingEmail(false); return }

    const newToken = generateToken()

    const { data: profile } = await supabase
      .from('profiles')
      .select('username, full_name')
      .eq('id', user.id)
      .maybeSingle()

    await supabase.from('profiles').update({
      parent_name: newParentName.trim() || null,
      parent_email: newParentEmail.trim(),
      parent_approval_token: newToken,
      parent_approval_token_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    }).eq('id', user.id)

    await supabase.functions.invoke('send-parent-approval-email', {
      body: {
        parentEmail: newParentEmail.trim(),
        parentName: newParentName.trim() || undefined,
        childUsername: profile?.username,
        childFullName: profile?.full_name ?? undefined,
        token: newToken,
      },
    })

    setChangingEmail(false)
    setChangeEmailSuccess(true)
    setShowChangeEmail(false)
    setNewParentName('')
    setNewParentEmail('')
    setResendSuccess(false)
  }

  const handleExit = async () => {
    const supabase = getSupabaseClient()
    if (supabase && user) {
      await supabase.from('profiles').delete().eq('id', user.id)
      await supabase.auth.signOut()
    }
    await Promise.all([
      storage.delete('profile.onboarding_complete'),
      storage.delete('onboarding.pending'),
      storage.delete('onboarding.method'),
      storage.delete('onboarding.approval_token'),
    ])
    router.replace('/(onboarding)/welcome')
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const isApproved = status === 'approved'
  const isDeclined = status === 'declined'
  const isPending = status === 'pending'

  const statusIcon: keyof typeof Ionicons.glyphMap = isApproved
    ? 'checkmark-circle'
    : isDeclined
    ? 'close-circle'
    : 'time-outline'

  const statusColor = isApproved ? colors.green : isDeclined ? '#dc2626' : colors.dim

  const statusLabel = isApproved
    ? 'Approved'
    : isDeclined
    ? 'Permission Not Granted'
    : 'Waiting for Approval'

  const subtext = isApproved
    ? 'Your parent or guardian has approved your account. Tap Start Exploring to begin!'
    : isDeclined
    ? 'Your parent or legal guardian denied access to WildKind.'
    : 'Still waiting for your parent or guardian to approve.'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View style={styles.topBarSpacer} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit and start over"
          onPress={handleExit}
          style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.exitText, { fontFamily: 'Nunito_700Bold' }]}>Exit</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Waiting for Parent Approval
        </Text>

        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Your parent or legal guardian needs to approve your WildKind account before you can start exploring.
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          We've sent a permission request to the email address you provided.
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Once approved, this screen will unlock automatically.
        </Text>

        {isPending && (
          <View style={styles.changeEmailSection}>
            {!showChangeEmail ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Change parent or guardian email"
                onPress={() => setShowChangeEmail(true)}
                style={({ pressed }) => [styles.changeEmailLink, pressed && { opacity: 0.6 }]}>
                <Ionicons name="mail-outline" size={16} color={colors.green} />
                <Text style={[styles.changeEmailLinkText, { fontFamily: 'Nunito_700Bold' }]}>
                  {changeEmailSuccess ? 'Change email again' : 'Change parent or guardian email'}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.changeEmailForm}>
                <Text style={[styles.changeEmailFormTitle, { fontFamily: 'Nunito_700Bold' }]}>
                  Update contact details
                </Text>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { fontFamily: 'Nunito_700Bold' }]}>Parent or Guardian Name</Text>
                  <TextInput
                    style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
                    placeholder="e.g. Jane Smith"
                    placeholderTextColor={colors.dim}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={newParentName}
                    onChangeText={setNewParentName}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={[styles.fieldLabel, { fontFamily: 'Nunito_700Bold' }]}>Parent or Guardian Email</Text>
                  <TextInput
                    style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
                    placeholder="parent@example.com"
                    placeholderTextColor={colors.dim}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={newParentEmail}
                    onChangeText={setNewParentEmail}
                  />
                </View>
                <View style={styles.changeEmailActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Cancel"
                    onPress={() => { setShowChangeEmail(false); setNewParentName(''); setNewParentEmail('') }}
                    style={({ pressed }) => [styles.cancelBtn, pressed && { opacity: 0.6 }]}>
                    <Text style={[styles.cancelText, { fontFamily: 'Nunito_700Bold' }]}>Cancel</Text>
                  </Pressable>
                  <View style={[styles.sendWrap, !newParentEmail.trim() && styles.sendWrapDisabled]}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Send permission request to new email"
                      onPress={handleChangeEmail}
                      disabled={changingEmail || !newParentEmail.trim()}
                      style={({ pressed }) => [
                        styles.sendBtn,
                        !newParentEmail.trim() && styles.sendBtnDisabled,
                        pressed && newParentEmail.trim() && styles.sendBtnPressed,
                      ]}>
                      {changingEmail
                        ? <ActivityIndicator size="small" color={colors.card} />
                        : <Text style={[styles.sendBtnText, { fontFamily: 'Nunito_700Bold' }]}>Send Request</Text>
                      }
                    </Pressable>
                  </View>
                </View>
              </View>
            )}
            {changeEmailSuccess && !showChangeEmail && (
              <Text style={[styles.successNote, { fontFamily: 'Nunito_400Regular' }]}>
                New permission request sent.
              </Text>
            )}
          </View>
        )}

        <View style={styles.statusCard}>
          <Text style={[styles.statusLabel, { fontFamily: 'Nunito_700Bold' }]}>Approval Status</Text>
          <View style={styles.statusRow}>
            <Ionicons name={statusIcon} size={20} color={statusColor} />
            <Text style={[styles.statusText, { fontFamily: 'Nunito_700Bold', color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.subtext, { fontFamily: 'Nunito_400Regular', color: statusColor }]}>
          {subtext}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
        <View style={[styles.ctaWrap, !isApproved && styles.ctaWrapDisabled]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start Exploring"
            onPress={handleStartExploring}
            disabled={!isApproved || loading}
            style={({ pressed }) => [
              styles.cta,
              !isApproved && styles.ctaFaceDisabled,
              pressed && isApproved && styles.ctaPressed,
            ]}>
            {loading
              ? <ActivityIndicator color={isApproved ? colors.card : colors.switchOff} />
              : <Text style={[
                  styles.ctaText,
                  { fontFamily: 'BricolageGrotesque_800ExtraBold' },
                  !isApproved && styles.ctaTextDisabled,
                ]}>Start Exploring</Text>
            }
          </Pressable>
        </View>

        {isPending && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Resend permission request"
            onPress={handleResend}
            disabled={resending}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.secondaryText, { fontFamily: 'Nunito_700Bold', color: colors.green }]}>
              {resending ? 'Sending…' : resendSuccess ? 'Sent!' : 'Resend Permission Request'}
            </Text>
          </Pressable>
        )}

        {isDeclined && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Start over"
            onPress={handleExit}
            style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.6 }]}>
            <Text style={[styles.secondaryText, { fontFamily: 'Nunito_700Bold' }]}>Start Over</Text>
          </Pressable>
        )}

        <Text style={[styles.privacyNote, { fontFamily: 'Nunito_400Regular' }]}>
          For your privacy and safety, WildKind requires parent permission for explorers under 13.
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: space[24],
    paddingTop: space[8],
    paddingBottom: space[4],
  },
  topBarSpacer: { flex: 1 },
  exitBtn: { paddingVertical: space[8], paddingLeft: space[16] },
  exitText: { fontSize: typeTokens.size.body, color: colors.dim },
  scroll: { paddingHorizontal: space[24], paddingTop: space[16], paddingBottom: space[16] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[24] },
  body: { fontSize: typeTokens.size.bodyLG, color: colors.ink2, lineHeight: 26, marginBottom: space[16] },
  changeEmailSection: { marginBottom: space[24] },
  changeEmailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[8],
    paddingVertical: space[4],
  },
  changeEmailLinkText: { fontSize: typeTokens.size.body, color: colors.green },
  changeEmailForm: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    padding: space[16],
    gap: space[16],
  },
  changeEmailFormTitle: {
    fontSize: typeTokens.size.label,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldGroup: { gap: space[8] },
  fieldLabel: {
    fontSize: typeTokens.size.caption,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    fontSize: typeTokens.size.body,
    color: colors.ink,
  },
  changeEmailActions: { flexDirection: 'row', gap: space[8] },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: space[16],
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.card,
  },
  cancelText: { fontSize: typeTokens.size.body, color: colors.dim },
  sendWrap: {
    flex: 2,
    backgroundColor: colors.greenDeep,
    borderRadius: radius.md,
    paddingBottom: 4,
  },
  sendWrapDisabled: { backgroundColor: colors.hairline },
  sendBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.md,
    paddingVertical: space[16],
    alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#E4E9EE' },
  sendBtnPressed: { transform: [{ translateY: 2 }] },
  sendBtnText: { fontSize: typeTokens.size.body, color: colors.card },
  successNote: { fontSize: typeTokens.size.caption, color: colors.green, marginTop: space[8] },
  statusCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    padding: space[16],
    gap: space[8],
    marginBottom: space[16],
  },
  statusLabel: {
    fontSize: typeTokens.size.label,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  statusText: { fontSize: typeTokens.size.body },
  subtext: { fontSize: typeTokens.size.body, lineHeight: 22, marginBottom: space[32] },
  footer: {
    paddingHorizontal: space[24],
    paddingTop: space[16],
    backgroundColor: colors.bg,
    gap: space[8],
  },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4 },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaFaceDisabled: { backgroundColor: '#E4E9EE', opacity: 0.4 },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaTextDisabled: { color: colors.switchOff },
  secondaryBtn: { alignItems: 'center', paddingVertical: space[8] },
  secondaryText: { fontSize: typeTokens.size.body, color: colors.dim },
  privacyNote: { fontSize: typeTokens.size.caption, color: colors.dim, textAlign: 'center', lineHeight: 18, paddingTop: space[4] },
})
