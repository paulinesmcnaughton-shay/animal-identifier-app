import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { storage } from '@/util/storage'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

export function ParentSetupRequiredScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleContinue = async () => {
    await storage.set('onboarding.requires_parent_setup', 'true')
    router.replace('/parent-permission')
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, space[32]) }]}>
      <View style={styles.heroWrap}>
        <Text style={styles.heroEmoji}>🌿</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Parent Setup Required
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Because this explorer is under 13, a parent or guardian needs to set up and manage this account.
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          WildKind uses photos and location to help identify nature finds. A parent can manage privacy, family location, and map sharing.
        </Text>
      </View>

      <View style={styles.actions}>
        <View style={styles.ctaWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Parent Setup"
            onPress={handleContinue}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
              Continue with Parent Setup
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.backText, { fontFamily: 'Nunito_700Bold' }]}>Back</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: space[24],
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  heroWrap: {
    alignItems: 'center',
    marginTop: space[48],
    marginBottom: space[32],
  },
  heroEmoji: {
    fontSize: 80,
  },
  content: {
    flex: 1,
  },
  heading: {
    fontSize: typeTokens.size.displayLG,
    color: colors.ink,
    marginBottom: space[16],
  },
  body: {
    fontSize: typeTokens.size.bodyLG,
    color: colors.ink2,
    lineHeight: 26,
    marginBottom: space[32],
  },
  actions: {
    gap: space[16],
  },
  ctaWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
  },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
  backText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
  },
})
