import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfilePhotoPickerSheet } from '@/components/profile/ProfilePhotoPickerSheet'
import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import {
  getUsernameValidationError,
  normalizeUsername,
  sanitizeUsernameInput,
} from '@/features/settings/username'
import { Button } from '@/design/atoms/Button'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  SETTINGS_DEFAULTS,
  loadAccountProfile,
  updateAccountProfile,
} from '@/features/settings/account-profile'
import { getSupabaseClient } from '@/lib/supabase/client'
import {
  type ProfileAvatarSource,
  resetToDefaultAvatar,
  saveProfilePhotoFromSource,
} from '@/features/settings/profile-avatar'

const BLANK_ERROR = "This field can't be left blank."

export function AccountSettingsScreenContent() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>(SETTINGS_DEFAULTS.displayName)
  const [username, setUsername] = useState<string>(SETTINGS_DEFAULTS.username)
  const [email, setEmail] = useState<string>(SETTINGS_DEFAULTS.email)
  const [phone, setPhone] = useState<string>(SETTINGS_DEFAULTS.phone)

  const [displayNameError, setDisplayNameError] = useState<string | null>(null)
  const [usernameError, setUsernameError] = useState<string | null>(null)
  const [emailError, setEmailError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const [avatarSource, setAvatarSource] = useState<ProfileAvatarSource | null>(null)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const [pickingPhoto, setPickingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  const hasErrors = !!displayNameError || !!usernameError || !!emailError || !!phoneError

  const loadFields = useCallback(async () => {
    const profile = await loadAccountProfile()
    setDisplayName(profile.displayName)
    setUsername(normalizeUsername(profile.username))
    setEmail(profile.email)
    setPhone(profile.phone)
    setDisplayNameError(null)
    setUsernameError(null)
    setEmailError(null)
    setPhoneError(null)
    setAvatarSource(null)
  }, [])

  useEffect(() => {
    void loadFields()
  }, [loadFields])

  const handleOpenPhotoSheet = () => {
    if (!pickingPhoto) setPhotoSheetOpen(true)
  }

  const handlePickPhoto = async (source: 'camera' | 'library') => {
    setPhotoSheetOpen(false)
    setPickingPhoto(true)
    try {
      const next = await saveProfilePhotoFromSource(source)
      if (next) setAvatarSource(next)
    } finally {
      setPickingPhoto(false)
    }
  }

  const handleUseDefaultAvatar = async () => {
    setPhotoSheetOpen(false)
    setPickingPhoto(true)
    try {
      await resetToDefaultAvatar()
      setAvatarSource(null)
    } finally {
      setPickingPhoto(false)
    }
  }

  const handleDisplayNameBlur = () => {
    setDisplayNameError(displayName.trim() ? null : BLANK_ERROR)
  }

  const handleUsernameChange = (text: string) => {
    if (/\s/.test(text)) {
      setUsernameError('Usernames cannot contain spaces.')
    } else {
      setUsernameError(null)
    }
    setUsername(sanitizeUsernameInput(text))
  }

  const handleUsernameBlur = () => {
    if (!username.trim()) {
      setUsernameError(BLANK_ERROR)
    }
  }

  const handleEmailBlur = () => {
    if (!email.trim()) {
      setEmailError(BLANK_ERROR)
    } else if (!email.trim().includes('@')) {
      setEmailError('Enter a valid email address.')
    } else {
      setEmailError(null)
    }
  }

  const handlePhoneBlur = () => {
    setPhoneError(phone.trim() ? null : BLANK_ERROR)
  }

  const handleSave = async () => {
    const trimmedName = displayName.trim()
    const trimmedUser = normalizeUsername(username)
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    const nameErr = trimmedName ? null : BLANK_ERROR
    const userErr = !trimmedUser ? BLANK_ERROR : getUsernameValidationError(trimmedUser)
    const emailErr = !trimmedEmail ? BLANK_ERROR : (!trimmedEmail.includes('@') ? 'Enter a valid email address.' : null)
    const phoneErr = trimmedPhone ? null : BLANK_ERROR

    if (nameErr) setDisplayNameError(nameErr)
    if (userErr) setUsernameError(userErr)
    if (emailErr) setEmailError(emailErr)
    if (phoneErr) setPhoneError(phoneErr)

    if (nameErr || userErr || emailErr || phoneErr) return

    const supabase = getSupabaseClient()
    if (supabase) {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id
      if (currentUserId) {
        const { data: existing } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', trimmedUser)
          .neq('id', currentUserId)
          .maybeSingle()
        if (existing) {
          Alert.alert('Username taken', 'That username is already taken. Try a different one.')
          return
        }
      }
    }

    setSaving(true)
    try {
      await updateAccountProfile({
        displayName: trimmedName,
        username: trimmedUser,
        email: trimmedEmail,
        phone: trimmedPhone,
      })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
    <SettingsDetailShell
      title="Profile"
      onBack={() => router.back()}
      sectionLabel="PUBLIC PROFILE"
      contentStyle={styles.content}
      footer={
        <View style={styles.saveWrap}>
          <Button
            label={saving ? 'Saving…' : 'Save changes'}
            onPress={() => void handleSave()}
            disabled={saving || hasErrors}
          />
        </View>
      }>
      <View style={styles.avatarSection}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
          onPress={handleOpenPhotoSheet}
          style={({ pressed }) => [pressed && styles.avatarPressed]}>
          <ProfileAvatar
            size={88}
            source={avatarSource}
          />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleOpenPhotoSheet} disabled={pickingPhoto}>
          <Text style={styles.changePhoto}>{pickingPhoto ? 'Opening…' : 'Change photo'}</Text>
        </Pressable>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Full name</Text>
        <TextInput
          value={displayName}
          onChangeText={(text) => {
            setDisplayName(text)
            if (text.trim()) setDisplayNameError(null)
          }}
          onBlur={handleDisplayNameBlur}
          placeholder="Your name"
          placeholderTextColor={colors.dim}
          style={[styles.input, displayNameError ? styles.inputError : null]}
          autoCapitalize="words"
          returnKeyType="next"
        />
        {displayNameError ? (
          <Text style={styles.fieldError}>{displayNameError}</Text>
        ) : (
          <Text style={styles.fieldHint}>Your name is private and never shown publicly.</Text>
        )}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Username</Text>
        <View style={[styles.usernameRow, usernameError ? styles.fieldBorderError : null]}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            value={username}
            onChangeText={handleUsernameChange}
            onBlur={handleUsernameBlur}
            placeholder="handle"
            placeholderTextColor={colors.dim}
            style={[styles.input, styles.usernameInput]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
        {usernameError ? (
          <Text style={styles.fieldError}>{usernameError}</Text>
        ) : null}
      </View>

      <Text style={[styles.fieldLabel, styles.sectionGap]}>Contact</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          value={email}
          onChangeText={(text) => {
            setEmail(text)
            if (text.trim()) setEmailError(null)
          }}
          onBlur={handleEmailBlur}
          placeholder="you@email.com"
          placeholderTextColor={colors.dim}
          style={[styles.input, emailError ? styles.inputError : null]}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
        />
        {emailError ? (
          <Text style={styles.fieldError}>{emailError}</Text>
        ) : null}
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={(text) => {
            setPhone(text)
            if (text.trim()) setPhoneError(null)
          }}
          onBlur={handlePhoneBlur}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={colors.dim}
          style={[styles.input, phoneError ? styles.inputError : null]}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          returnKeyType="done"
        />
        {phoneError ? (
          <Text style={styles.fieldError}>{phoneError}</Text>
        ) : null}
      </View>
    </SettingsDetailShell>

    <ProfilePhotoPickerSheet
      visible={photoSheetOpen}
      onClose={() => setPhotoSheetOpen(false)}
      onSelectCamera={() => void handlePickPhoto('camera')}
      onSelectLibrary={() => void handlePickPhoto('library')}
      onUseDefault={() => void handleUseDefaultAvatar()}
    />
    </>
  )
}

const styles = StyleSheet.create({
  content: {
    gap: space[16],
  },
  avatarSection: {
    alignItems: 'center',
    gap: space[8],
    marginBottom: space[8],
  },
  avatarPressed: {
    opacity: 0.85,
  },
  changePhoto: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.greenLight,
  },
  fieldGroup: {
    gap: space[8],
  },
  sectionGap: {
    marginTop: space[8],
  },
  fieldLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: space[4],
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  inputError: {
    borderColor: colors.coral,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingLeft: space[16],
  },
  fieldBorderError: {
    borderColor: colors.coral,
  },
  fieldError: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.coral,
    marginLeft: space[4],
  },
  fieldHint: {
    fontSize: typeTokens.size.caption,
    color: colors.dim,
    marginLeft: space[4],
  },
  atSign: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.dim,
  },
  usernameInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: space[4],
  },
  saveWrap: {
    marginTop: space[24],
  },
})
