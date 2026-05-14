import {
  BricolageGrotesque_800ExtraBold,
  useFonts as useBricolageFonts,
} from '@expo-google-fonts/bricolage-grotesque'
import { Nunito_400Regular, Nunito_600SemiBold, useFonts as useNunitoFonts } from '@expo-google-fonts/nunito'
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

import { colors, radius, space, type as typeTokens } from '@/src/design/tokens'
import { storage } from '@/src/util/storage'

export function SignupScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [bricolageLoaded] = useBricolageFonts({ BricolageGrotesque_800ExtraBold })
  const [nunitoLoaded] = useNunitoFonts({ Nunito_400Regular, Nunito_600SemiBold })
  const fontsReady = bricolageLoaded && nunitoLoaded

  const handleCreate = async () => {
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

        <Text style={[styles.heading, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Create account</Text>
        <Text style={[styles.sub, { fontFamily: 'Nunito_400Regular' }]}>Start building your field guide</Text>

        <View style={styles.fields}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_600SemiBold' }]}>Username</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="e.g. naturelover42"
              placeholderTextColor={colors.dim}
              autoCapitalize="none"
              autoCorrect={false}
              value={username}
              onChangeText={setUsername}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { fontFamily: 'Nunito_600SemiBold' }]}>Email</Text>
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
            <Text style={[styles.label, { fontFamily: 'Nunito_600SemiBold' }]}>Password</Text>
            <TextInput
              style={[styles.input, { fontFamily: 'Nunito_400Regular' }]}
              placeholder="Min. 8 characters"
              placeholderTextColor={colors.dim}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create account"
          onPress={handleCreate}
          style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
          <Text style={[styles.ctaText, { fontFamily: 'BricolageGrotesque_800ExtraBold' }]}>Create Account</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Log in instead"
          onPress={() => router.replace('/login')}
          style={({ pressed }) => [styles.switchBtn, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.switchText, { fontFamily: 'Nunito_400Regular' }]}>
            Already have an account? <Text style={styles.switchTextBold}>Log In</Text>
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
  cta: {
    backgroundColor: colors.green,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.greenDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
    marginBottom: space[24],
  },
  ctaPressed: {
    opacity: 0.92,
    transform: [{ translateY: 1 }],
  },
  ctaText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
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
    fontWeight: '700',
  },
})
