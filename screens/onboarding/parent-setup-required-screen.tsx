import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_700Bold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
import { useRouter } from 'expo-router'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import { storage } from '@/util/storage'

export function ParentSetupRequiredScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleContinue = async () => {
    await storage.set('onboarding.requires_parent_setup', 'true')
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
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
          Parent Setup Required
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          Because this explorer is under 13, a parent or guardian needs to set up and manage this account.
        </Text>
        <Text style={[styles.body, { fontFamily: 'Nunito_400Regular' }]}>
          WildKind uses photos and location to help identify nature finds. A parent can manage privacy, family location, and map sharing.
        </Text>

        <Image
          source={require('@/assets/images/Parent_setup_required.png')}
          style={styles.illustration}
          resizeMode="contain"
          accessibilityLabel="Parent setup illustration"
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space[24]) }]}>
        <View style={styles.ctaWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue"
            onPress={handleContinue}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>
              Continue
            </Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Exit setup"
          onPress={() => router.back()}
          style={({ pressed }) => [styles.exitBtn, pressed && { opacity: 0.6 }]}>
          <Text style={[styles.exitText, { fontFamily: 'Nunito_700Bold' }]}>Exit Setup</Text>
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { paddingHorizontal: space[24], paddingTop: space[40] },
  heading: { fontSize: typeTokens.size.displayLG, color: colors.ink, marginBottom: space[16] },
  body: { fontSize: typeTokens.size.bodyLG, color: colors.ink2, lineHeight: 26, marginBottom: space[16] },
  footer: {
    paddingHorizontal: space[24],
    paddingTop: space[16],
    backgroundColor: colors.bg,
  },
  ctaWrap: {
    backgroundColor: colors.greenDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
    marginBottom: space[16],
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: { transform: [{ translateY: 2 }] },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  illustration: {
    width: '100%',
    height: 240,
    marginTop: space[32],
  },
  exitBtn: { alignItems: 'center', paddingVertical: space[8] },
  exitText: { fontSize: typeTokens.size.body, color: colors.dim },
})
