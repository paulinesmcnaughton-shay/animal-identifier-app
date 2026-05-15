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
import { storage } from '@/util/storage'

export function LoginScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_700Bold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleLogin = async () => {
    await storage.set('isLoggedIn', 'true')
    router.replace('/home')
  }

  if (!fontsReady) {
    return (
      <View style={[styles.loader, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.green} />
      </View>
    )
  }

  return (
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

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Welcome back</Text>
        <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>Log in to your Wildr account</Text>

        <View style={styles.fields}>
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
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="Your password"
              placeholderTextColor={colors.dim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              onPress={() => {}}
              style={({ pressed }) => [styles.forgotBtn, pressed && { opacity: 0.6 }]}>
              <Text style={[styles.forgotText, { fontFamily: 'Nunito_400Regular' }]}>Forgot password?</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.ctaWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log in"
            onPress={handleLogin}
            style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Log In</Text>
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
            onPress={() => {}}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="logo-apple" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Apple</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            onPress={() => {}}
            style={({ pressed }) => [styles.socialBtn, pressed && { opacity: 0.7 }]}>
            <Ionicons name="logo-google" size={20} color={colors.ink} />
            <Text style={[styles.socialText, { fontFamily: 'Nunito_700Bold' }]}>Google</Text>
          </Pressable>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create an account instead"
          onPress={() => router.replace('/signup')}
          style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.switchText, { fontFamily: 'Nunito_400Regular' }]}>
            Don't have an account? <Text style={styles.switchTextBold}>Sign Up</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: space[24],
  },
  backBtn: {
    alignSelf: 'flex-start',
    padding: space[4],
  },
  heading: {
    fontSize: typeTokens.size.displayLG,
    color: colors.ink,
    marginBottom: space[8],
  },
  sub: {
    fontSize: typeTokens.size.bodyLG,
    color: colors.dim,
    marginBottom: space[40],
  },
  fields: {
    gap: space[20],
    marginBottom: space[32],
  },
  fieldGroup: {
    gap: space[6],
  },
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
    paddingVertical: space[14],
    fontSize: typeTokens.size.bodyLG,
    color: colors.ink,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    paddingVertical: space[4],
  },
  forgotText: {
    fontSize: typeTokens.size.bodySM,
    color: colors.green,
  },
  ctaWrap: {
    backgroundColor: colors.greenDark,
    borderRadius: radius.lg,
    paddingBottom: 4,
    marginBottom: space[24],
  },
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaPressed: {
    transform: [{ translateY: 2 }],
  },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[12],
    marginBottom: space[16],
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.hairline,
  },
  dividerText: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
  },
  socialRow: {
    flexDirection: 'row',
    gap: space[12],
    marginBottom: space[24],
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[8],
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: radius.lg,
    paddingVertical: space[14],
  },
  socialText: {
    fontSize: typeTokens.size.body,
    color: colors.ink,
  },
  switchBtn: {
    alignItems: 'center',
    paddingVertical: space[8],
  },
  switchText: {
    fontSize: typeTokens.size.body,
    color: colors.dim,
  },
  switchTextBold: {
    color: colors.green,
    fontWeight: typeTokens.body.weights.bold,
  },
})
