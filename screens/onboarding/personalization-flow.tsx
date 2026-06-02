import { Ionicons } from '@expo/vector-icons'
import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import * as Location from 'expo-location'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
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

import { SightingsSharingFields } from '@/components/settings/SightingsSharingFields'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { saveSightingsVisibility } from '@/features/settings/preferences'
import { sightingsVisibilityFromSharingPrefs } from '@/features/settings/sightings-sharing-prefs'
import { syncAccountProfileFromAuth } from '@/features/settings/sync-account-profile'
import { deviceTimeZone } from '@/features/profile/time-greeting'
import {
  getUsernameValidationError,
  normalizeUsername,
  sanitizeUsernameInput,
} from '@/features/settings/username'
import { useAuth } from '@/lib/auth/auth-context'
import {
  clearPendingOnboarding,
  clearPendingPassword,
  getPendingPassword,
} from '@/lib/onboarding/pending-signup'
import { getSupabaseClient } from '@/lib/supabase/client'
import { storage } from '@/util/storage'

const INTERESTS = [
  { id: 'birds', label: '🐦 Birds' },
  { id: 'insects', label: '🦋 Insects & Bugs' },
  { id: 'spiders', label: '🕷️ Spiders' },
  { id: 'snakes', label: '🐍 Snakes & Reptiles' },
  { id: 'plants', label: '🌿 Plants & Flowers' },
  { id: 'marine', label: '🐠 Marine Life' },
  { id: 'mammals', label: '🦁 Mammals' },
  { id: 'fungi', label: '🍄 Fungi & Mushrooms' },
  { id: 'trees', label: '🌳 Trees & Shrubs' },
  { id: 'scorpions', label: '🦂 Scorpions & Arachnids' },
  { id: 'rodents', label: '🐀 Rodents & Small Mammals' },
  { id: 'amphibians', label: '🦎 Amphibians' },
]

function calculateAge(dob: Date): number {
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

function dobToAgeGroup(dob: Date): string {
  const age = calculateAge(dob)
  if (age < 13) return 'kids'
  if (age < 18) return 'teen'
  return 'adult'
}

export function PersonalizationFlow() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, signUp, isLoading: authLoading } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [username, setUsername] = useState('')
  const [locationText, setLocationText] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [timezone, setTimezone] = useState<string | null>(null)
  const [detectingLocation, setDetectingLocation] = useState(false)

  const [interests, setInterests] = useState<string[]>([])
  const [dob, setDob] = useState<Date | null>(null)
  const [showUsername, setShowUsername] = useState(true)
  const [isChildAccount, setIsChildAccount] = useState(false)
  const [fullName, setFullName] = useState('')

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  useEffect(() => {
    if (authLoading) return

    void (async () => {
      const method = await storage.getString('onboarding.method')

      if (!user) {
        if (method !== 'email') {
          router.replace('/login')
          return
        }
        const pendingUsername = await storage.getString('onboarding.username')
        if (pendingUsername) setUsername((current) => current || sanitizeUsernameInput(pendingUsername))
      } else {
        const metadataUsername = user.user_metadata?.username
        if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
          setUsername((current) => current || sanitizeUsernameInput(metadataUsername))
        }
      }

      const accountType = await storage.getString('onboarding.account_type')
      if (accountType === 'child') setIsChildAccount(true)

      const storedFullName = await storage.getString('onboarding.full_name')
      if (storedFullName) setFullName(storedFullName)

      const stored = await storage.getString('onboarding.date_of_birth')
      if (stored) {
        setDob(new Date(stored))
        void storage.delete('onboarding.date_of_birth')
      }
    })()
  }, [authLoading, router, user])

  const detectLocation = async () => {
    setDetectingLocation(true)
    setError(null)

    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setError('Location permission is required to detect your area.')
        return
      }

      const loc = await Location.getCurrentPositionAsync({})
      const [place] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      })

      setLatitude(loc.coords.latitude)
      setLongitude(loc.coords.longitude)
      setTimezone(deviceTimeZone())
      setLocationText(
        [place?.city, place?.region, place?.country].filter(Boolean).join(', '),
      )
    } catch {
      setError('Could not detect location')
    } finally {
      setDetectingLocation(false)
    }
  }

  const toggleInterest = (id: string) => {
    setInterests((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const handleFinish = async () => {
    const usernameError = getUsernameValidationError(username)
    if (usernameError) { setError(usernameError); return }

    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    if (!supabase) {
      setLoading(false)
      setError('Something went wrong. Please try again.')
      return
    }

    const method = await storage.getString('onboarding.method')
    let activeUser = user

    if (method === 'email') {
      const pendingEmail = await storage.getString('onboarding.email')
      const pendingPassword = getPendingPassword()

      if (!pendingEmail || !pendingPassword) {
        setLoading(false)
        setError('Your session expired. Please start over.')
        await clearPendingOnboarding()
        router.replace('/signup')
        return
      }

      const pendingUsername = await storage.getString('onboarding.username')
      const result = await signUp({ email: pendingEmail, password: pendingPassword, username: pendingUsername ?? username })
      clearPendingPassword()

      if (result.error) { setLoading(false); setError(result.error); return }

      if (result.needsEmailConfirmation) {
        setLoading(false)
        await clearPendingOnboarding()
        setError('Check your email to confirm your account, then log in.')
        router.replace('/login')
        return
      }

      const { data: { user: newUser } } = await supabase.auth.getUser()
      if (!newUser) {
        setLoading(false)
        setError('Account created but could not load your profile. Please log in.')
        return
      }
      activeUser = newUser
    }

    if (!activeUser) {
      setLoading(false)
      setError('You must be logged in to continue.')
      return
    }

    const [accountType, parentName, parentEmail, parentConfirmed, requiresParentSetup, approvalToken] = await Promise.all([
      storage.getString('onboarding.account_type'),
      storage.getString('onboarding.parent_name'),
      storage.getString('onboarding.parent_email'),
      storage.getString('onboarding.parent_permission_confirmed'),
      storage.getString('onboarding.requires_parent_setup'),
      storage.getString('onboarding.approval_token'),
    ])

    const isChild = accountType === 'child'
    const isTeen = accountType === 'teen'

    const canPublish = isChild || isTeen ? false : true
    const showUsernameOnMap = isChild || isTeen ? false : showUsername

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: activeUser.id,
      username: normalizeUsername(username),
      location_text: locationText.trim() || null,
      latitude,
      longitude,
      timezone: timezone ?? deviceTimeZone(),
      interests,
      age_group: dob ? dobToAgeGroup(dob) : null,
      date_of_birth: dob ? dob.toISOString().split('T')[0] : null,
      account_type: accountType ?? 'adult',
      parent_name: parentName ?? null,
      parent_email: parentEmail ?? null,
      parent_permission_confirmed: parentConfirmed === 'true',
      family_account_enabled: isChild,
      can_publish_to_nearby: canPublish,
      show_username_on_map: showUsernameOnMap,
      requires_parent_setup: requiresParentSetup === 'true',
      full_name: fullName.trim() || null,
      age_verified: true,
      onboarding_complete: !isChild,
      parent_approval_status: isChild ? 'pending' : null,
      parent_approval_token: isChild && approvalToken ? approvalToken : null,
      parent_approval_token_expires_at: isChild && approvalToken
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        : null,
    })

    setLoading(false)

    if (saveError) { setError(saveError.message); return }

    await Promise.all([
      storage.delete('onboarding.account_type'),
      storage.delete('onboarding.parent_name'),
      storage.delete('onboarding.parent_email'),
      storage.delete('onboarding.parent_permission_confirmed'),
      storage.delete('onboarding.requires_parent_setup'),
    ])

    await clearPendingOnboarding()
    await saveSightingsVisibility(sightingsVisibilityFromSharingPrefs(canPublish, showUsernameOnMap))

    if (isChild) {
      router.replace('/(onboarding)/waiting-approval')
      return
    }

    await storage.set('profile.onboarding_complete', 'true')
    await syncAccountProfileFromAuth(activeUser)
    router.replace('/home')
  }

  if (!fontsReady || authLoading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const handleChildSave = async () => {
    setLoading(true)
    setError(null)

    await Promise.all([
      storage.set('onboarding.username', username.trim()),
      storage.set('onboarding.full_name', fullName.trim()),
      locationText.trim()
        ? storage.set('onboarding.location_text', locationText.trim())
        : storage.delete('onboarding.location_text'),
      latitude !== null
        ? storage.set('onboarding.latitude', String(latitude))
        : storage.delete('onboarding.latitude'),
      longitude !== null
        ? storage.set('onboarding.longitude', String(longitude))
        : storage.delete('onboarding.longitude'),
      timezone
        ? storage.set('onboarding.timezone', timezone)
        : storage.delete('onboarding.timezone'),
      interests.length > 0
        ? storage.set('onboarding.interests', JSON.stringify(interests))
        : storage.delete('onboarding.interests'),
      storage.set('onboarding.show_username', showUsername ? 'true' : 'false'),
    ])

    setLoading(false)
    router.push('/parent-permission')
  }

  const handleStepCta = () => {
    if (step === 1) {
      const usernameError = getUsernameValidationError(username)
      if (usernameError) { setError(usernameError); return }
      setError(null)
      setStep(2)
    } else {
      if (interests.length === 0) { setError('Pick at least one interest'); return }
      setError(null)
      isChildAccount ? void handleChildSave() : void handleFinish()
    }
  }

  const canProceed =
    step === 1
      ? username.trim().length > 0 && !getUsernameValidationError(username) && fullName.trim().length > 0
      : interests.length > 0

  const ctaLabel = step === 1 ? 'Continue' : isChildAccount ? 'Continue' : 'Start Exploring 🌿'
  const ctaA11y = step === 1 ? 'Continue to interests' : isChildAccount ? 'Continue to parent permission' : 'Finish setup and start exploring'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.progress}>
        {[1, 2].map((s) => (
          <View key={s} style={[styles.dot, step === s && styles.dotActive]} />
        ))}
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { fontFamily: 'Nunito_400Regular' }]}>{error}</Text>
        </View>
      )}

      {step === 1 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            Let's set up your profile
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            This is how other explorers will see you
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Full Name</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="e.g. Alex Johnson"
              placeholderTextColor={colors.dim}
              autoCapitalize="words"
              autoCorrect={false}
              value={fullName}
              onChangeText={setFullName}
            />
            <Text style={[styles.labelHint, { fontFamily: 'Nunito_400Regular' }]}>
              Your name is private and never shown publicly.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Username</Text>
              <Text style={[styles.labelHint, { fontFamily: 'Nunito_400Regular' }]}>(don't use your real name)</Text>
            </View>
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
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Your location</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="e.g. Atlanta, Georgia"
              placeholderTextColor={colors.dim}
              value={locationText}
              onChangeText={setLocationText}
            />
            <View style={styles.detectShadow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Detect my location"
                onPress={detectLocation}
                disabled={detectingLocation}
                style={({ pressed }) => [
                  styles.detectInner,
                  detectingLocation && styles.detectDisabled,
                  pressed && !detectingLocation && styles.detectPressed,
                ]}>
                {detectingLocation ? (
                  <ActivityIndicator size="small" color={colors.green} />
                ) : (
                  <>
                    <Ionicons name="location" size={18} color={colors.green} />
                    <Text style={styles.detectLabel}>Detect my location</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          <SightingsSharingFields
            shareFindings={false}
            showUsername={showUsername}
            onShareFindingsChange={() => {}}
            onShowUsernameChange={setShowUsername}
            variant="onboarding"
          />
        </ScrollView>
      )}

      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            What are you into?
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            Pick everything that interests you
          </Text>

          <View style={styles.grid}>
            {INTERESTS.map((item) => {
              const selected = interests.includes(item.id)
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}
                  onPress={() => toggleInterest(item.id)}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={[
                    styles.chipText,
                    { fontFamily: 'Nunito_700Bold' },
                    selected && styles.chipTextSelected,
                  ]}>
                    {item.label}
                  </Text>
                </Pressable>
              )
            })}
          </View>
        </ScrollView>
      )}

      <View style={[styles.stickyFooter, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
        <View style={[styles.ctaWrap, (!canProceed || loading) && styles.ctaWrapDisabled]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ctaA11y}
            onPress={handleStepCta}
            disabled={loading || !canProceed}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed, (loading || !canProceed) && styles.ctaDisabled]}>
            {loading
              ? <ActivityIndicator color={colors.dim} />
              : <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }, (!canProceed || loading) && styles.ctaTextDisabled]}>{ctaLabel}</Text>
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
  scroll: { paddingHorizontal: space[24], paddingTop: space[16], paddingBottom: space[16] },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: space[8], paddingVertical: space[16] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.hairline },
  dotActive: { width: 24, backgroundColor: colors.green },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: radius.md,
    padding: space[16],
    marginHorizontal: space[24],
    marginBottom: space[8],
  },
  errorText: { fontSize: typeTokens.size.bodySM, color: '#dc2626' },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[8] },
  sub: { fontSize: typeTokens.size.bodyLG, color: colors.dim, marginBottom: space[24] },
  stickyFooter: { paddingHorizontal: space[24], paddingTop: space[16], backgroundColor: colors.bg },
  fieldGroup: { gap: space[8], marginBottom: space[24] },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: space[8] },
  label: { fontSize: typeTokens.size.label, color: colors.ink2, textTransform: 'uppercase', letterSpacing: 0.5 },
  labelHint: { fontSize: typeTokens.size.caption, color: colors.dim },
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
  detectShadow: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
    marginTop: space[4],
  },
  detectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    paddingHorizontal: space[16],
  },
  detectPressed: {
    transform: [{ translateY: 2 }],
  },
  detectDisabled: {
    opacity: 0.7,
  },
  detectLabel: {
    fontFamily: typeTokens.body.family,
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.extra,
    color: colors.green,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: space[8], marginBottom: space[32] },
  chip: {
    paddingHorizontal: space[16],
    paddingVertical: space[8],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.card,
  },
  chipSelected: { backgroundColor: colors.green, borderColor: colors.green },
  chipText: { fontSize: typeTokens.size.body, color: colors.ink },
  chipTextSelected: { color: colors.card },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4 },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: space[16], alignItems: 'center' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaDisabled: { backgroundColor: '#E4E9EE' },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaTextDisabled: { color: colors.switchOff },
})
