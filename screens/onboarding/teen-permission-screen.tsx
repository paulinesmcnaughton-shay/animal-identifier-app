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
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { PrivacyTermsModal } from '@/screens/onboarding/privacy-terms-modal'
import { storage } from '@/util/storage'

export function TeenPermissionScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleContinue = async () => {
    if (!confirmed || loading) return
    setLoading(true)
    await storage.set('onboarding.parent_permission_confirmed', 'true')
    setLoading(false)
    router.replace('/personalize')
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Parent Permission
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Because you're under 18, you need permission from a parent or guardian to use WildKind.
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Your captures are private unless you choose to publish them. Public map sharing and location settings can be managed in Settings.
        </Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="I confirm that my parent or guardian allows me to use WildKind"
          onPress={() => setConfirmed((v) => !v)}
          style={styles.checkRow}>
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Ionicons name="checkmark" size={14} color={colors.card} />}
          </View>
          <Text style={[styles.checkLabel, { fontFamily: 'Nunito_400Regular' }]}>
            I confirm that my parent or guardian allows me to use WildKind and agrees to the{' '}
            <Text style={styles.link} onPress={() => setShowPrivacy(true)}>
              Terms of Use and Privacy Policy
            </Text>
            .
          </Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
        <View style={[styles.ctaWrap, !confirmed && styles.ctaWrapDisabled]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={handleContinue}
            disabled={loading || !confirmed}
            style={({ pressed }) => [
              styles.cta,
              !confirmed && styles.ctaFaceDisabled,
              pressed && confirmed && styles.ctaPressed,
            ]}>
            {loading
              ? <ActivityIndicator color={confirmed ? colors.card : colors.switchOff} />
              : <Text style={[
                  styles.ctaText,
                  { fontFamily: 'BricolageGrotesque_800ExtraBold' },
                  !confirmed && styles.ctaTextDisabled,
                ]}>Continue</Text>
            }
          </Pressable>
        </View>
      </View>

      <PrivacyTermsModal visible={showPrivacy} onClose={() => setShowPrivacy(false)} />
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space[24], paddingTop: space[16], paddingBottom: space[16] },
  backBtn: { alignSelf: 'flex-start', padding: space[4], marginBottom: space[32] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[16] },
  body: { fontSize: typeTokens.size.bodyLG, color: colors.ink2, lineHeight: 26, marginBottom: space[16] },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    marginTop: space[16],
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
  link: { color: colors.green, textDecorationLine: 'underline' },
})
