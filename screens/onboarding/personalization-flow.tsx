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

const GENDER_OPTIONS = [
  { id: 'female', label: 'Female', icon: 'female' as const },
  { id: 'male', label: 'Male', icon: 'male' as const },
  { id: 'other', label: 'Prefer not to say', icon: 'person-outline' as const },
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

function formatDob(dob: Date): string {
  return dob.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function PersonalizationFlow() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const { user, isLoading: authLoading } = useAuth()
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
  const [gender, setGender] = useState<string | null>(null)
  const [shareFindings, setShareFindings] = useState(false)
  const [showUsername, setShowUsername] = useState(true)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }

    const metadataUsername = user.user_metadata?.username
    if (typeof metadataUsername === 'string' && metadataUsername.trim()) {
      setUsername((current) => current || sanitizeUsernameInput(metadataUsername))
    }

    void storage.getString('pendingDob').then((stored) => {
      if (stored) {
        setDob(new Date(stored))
        void storage.delete('pendingDob')
      }
    })
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
    if (!dob) {
      setError('Please enter your date of birth')
      return
    }

    const usernameError = getUsernameValidationError(username)
    if (usernameError) {
      setError(usernameError)
      return
    }

    setLoading(true)
    setError(null)

    const supabase = getSupabaseClient()
    if (!supabase || !user) {
      setLoading(false)
      setError('You must be logged in to continue.')
      return
    }

    const { error: saveError } = await supabase.from('profiles').upsert({
      id: user.id,
      username: normalizeUsername(username),
      location_text: locationText.trim() || null,
      latitude,
      longitude,
      timezone: timezone ?? deviceTimeZone(),
      interests,
      age_group: dobToAgeGroup(dob),
      onboarding_complete: true,
    })

    setLoading(false)

    if (saveError) {
      setError(saveError.message)
      return
    }

    await saveSightingsVisibility(
      sightingsVisibilityFromSharingPrefs(shareFindings, showUsername),
    )
    await syncAccountProfileFromAuth(user)
    router.replace('/home')
  }

  if (!fontsReady || authLoading) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  const handleStepCta = () => {
    if (step === 1) {
      const usernameError = getUsernameValidationError(username)
      if (usernameError) { setError(usernameError); return }
      setError(null)
      setStep(2)
    } else if (step === 2) {
      if (interests.length === 0) { setError('Pick at least one interest'); return }
      setError(null)
      setStep(3)
    } else {
      void handleFinish()
    }
  }

  const canProceed =
    step === 1 ? username.trim().length > 0 && !getUsernameValidationError(username) :
    step === 2 ? interests.length > 0 :
    dob !== null

  const ctaLabel = step === 3 ? 'Start Exploring 🌿' : 'Continue'
  const ctaA11y = step === 1 ? 'Continue to interests' : step === 2 ? 'Continue to age group' : 'Finish setup and start exploring'

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
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
            <View style={styles.labelRow}>
              <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Username</Text>
              <Text style={[styles.labelHint, { fontFamily: 'Nunito_400Regular' }]}>(no spaces, use any special characters)</Text>
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
            shareFindings={shareFindings}
            showUsername={showUsername}
            onShareFindingsChange={setShareFindings}
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

      {step === 3 && (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
            Who's exploring?
          </Text>
          <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>
            We'll tailor your experience
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Date of Birth</Text>
            <View style={styles.dateField}>
              <Ionicons name="calendar-outline" size={20} color={colors.dim} />
              <Text style={[
                styles.dateText,
                { fontFamily: 'Nunito_400Regular' },
                !dob && styles.datePlaceholder,
              ]}>
                {dob
                  ? `${formatDob(dob)}  ·  ${calculateAge(dob)} years old`
                  : 'Birthday from your sign-up'}
              </Text>
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Text style={[styles.label, { fontFamily: 'Nunito_700Bold' }]}>Gender</Text>
              <Text style={[styles.labelHint, { fontFamily: 'Nunito_400Regular' }]}>(optional)</Text>
            </View>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map((option) => {
                const selected = gender === option.id
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={option.label}
                    onPress={() => setGender(selected ? null : option.id)}
                    style={({ pressed }) => [
                      styles.genderBtn,
                      selected && styles.genderBtnSelected,
                      pressed && { opacity: 0.8 },
                    ]}>
                    <Ionicons
                      name={option.icon}
                      size={22}
                      color={selected ? colors.card : colors.ink2}
                    />
                    <Text style={[
                      styles.genderLabel,
                      { fontFamily: 'Nunito_700Bold' },
                      selected && styles.genderLabelSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
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
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[16],
  },
  dateText: {
    flex: 1,
    fontSize: typeTokens.size.bodyLG,
    color: colors.ink,
  },
  datePlaceholder: { color: colors.dim },
  genderRow: { flexDirection: 'row', gap: space[8] },
  genderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    paddingVertical: space[16],
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    backgroundColor: colors.card,
  },
  genderBtnSelected: { backgroundColor: colors.green, borderColor: colors.green },
  genderLabel: { fontSize: typeTokens.size.bodySM, color: colors.ink2 },
  genderLabelSelected: { color: colors.card },
  ctaWrap: { backgroundColor: colors.greenDeep, borderRadius: radius.lg, paddingBottom: 4 },
  ctaWrapDisabled: { backgroundColor: colors.hairline },
  cta: { backgroundColor: colors.green, borderRadius: radius.lg, paddingVertical: space[16], alignItems: 'center' },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaDisabled: { backgroundColor: '#E4E9EE' },
  ctaText: { color: colors.card, fontSize: typeTokens.size.displaySM, letterSpacing: 0.3, textTransform: 'uppercase' },
  ctaTextDisabled: { color: colors.switchOff },
})
