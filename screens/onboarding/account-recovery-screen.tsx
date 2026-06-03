import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_500Medium, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  fetchDeletionScheduledFor,
  restoreAccount,
} from '@/features/settings/account-deletion'
import { useAuth } from '@/lib/auth/auth-context'

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function daysRemaining(deadline: Date): number {
  return Math.max(0, Math.ceil((deadline.getTime() - Date.now()) / 86_400_000))
}

export function AccountRecoveryScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { signOut } = useAuth()
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [bricolageReady] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoReady] = useNunitoFonts({ Nunito_500Medium, Nunito_700Bold })
  const fontsReady = bricolageReady && nunitoReady

  useEffect(() => {
    void fetchDeletionScheduledFor().then(setDeadline)
  }, [])

  const handleRestore = async () => {
    setRestoring(true)
    setError(null)
    const { error: err } = await restoreAccount()
    if (err) {
      setError('Could not restore your account. Please try again.')
      setRestoring(false)
      return
    }
    router.replace('/(tabs)/home')
  }

  const handleConfirmDelete = async () => {
    setConfirming(true)
    setError(null)
    await signOut()
    router.replace('/(onboarding)/welcome')
  }

  if (!fontsReady) {
    return <View style={[styles.root, { paddingTop: insets.top }]} />
  }

  const days = deadline ? daysRemaining(deadline) : null

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + space[24] }]}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Text style={styles.icon}>🌿</Text>
        </View>

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Account scheduled{'\n'}for deletion
        </Text>

        {deadline ? (
          <Text style={[styles.body, { fontFamily: 'Nunito_500Medium' }]}>
            Your account and all your sightings will be permanently deleted on{' '}
            <Text style={styles.bold}>{formatDate(deadline)}</Text>
            {days !== null && days > 0 ? ` — ${days} day${days === 1 ? '' : 's'} away` : ''}.
            {'\n\n'}
            Your sighting photos are safely stored and will come back with your account if you choose to restore it.
          </Text>
        ) : (
          <Text style={[styles.body, { fontFamily: 'Nunito_500Medium' }]}>
            Your account is scheduled for deletion. Restore it below to get everything back.
          </Text>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => void handleRestore()}
          disabled={restoring || confirming}
          style={({ pressed }) => [styles.restoreBtn, (restoring || confirming) && styles.btnDisabled, pressed && styles.btnPressed]}>
          {restoring ? (
            <ActivityIndicator color={colors.card} />
          ) : (
            <Text style={[styles.restoreBtnLabel, { fontFamily: 'Nunito_700Bold' }]}>
              Restore my account
            </Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void handleConfirmDelete()}
          disabled={restoring || confirming}
          style={({ pressed }) => [styles.deleteBtn, pressed && styles.btnPressed]}>
          {confirming ? (
            <ActivityIndicator color={colors.coral} />
          ) : (
            <Text style={[styles.deleteBtnLabel, { fontFamily: 'Nunito_700Bold' }]}>
              Continue with deletion
            </Text>
          )}
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space[32],
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: space[24],
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: `${colors.coral}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 36,
  },
  heading: {
    fontSize: typeTokens.size.displayMD,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  body: {
    fontSize: typeTokens.size.body,
    color: colors.ink2,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '700',
    color: colors.ink,
  },
  error: {
    fontSize: typeTokens.size.bodySM,
    color: colors.coral,
    fontWeight: '600',
  },
  actions: {
    gap: space[8],
  },
  restoreBtn: {
    backgroundColor: colors.green,
    borderRadius: radius.sm,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  restoreBtnLabel: {
    fontSize: typeTokens.size.body,
    fontWeight: '700',
    color: colors.card,
    letterSpacing: 0.2,
  },
  deleteBtn: {
    borderRadius: radius.sm,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  deleteBtnLabel: {
    fontSize: typeTokens.size.body,
    color: colors.coral,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnPressed: {
    opacity: 0.8,
  },
})
