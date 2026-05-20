import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'

import { ProfileAvatar } from '@/components/profile/ProfileAvatar'
import { ProfilePhotoPickerSheet } from '@/components/profile/ProfilePhotoPickerSheet'
import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { mockUser } from '@/data/mock'
import { Button } from '@/design/atoms/Button'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  SETTINGS_DEFAULTS,
  loadAccountProfile,
  updateAccountProfile,
} from '@/features/settings/account-profile'
import {
  type ProfileAvatarSource,
  saveProfilePhotoFromSource,
} from '@/features/settings/profile-avatar'

export function AccountSettingsScreenContent() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(SETTINGS_DEFAULTS.displayName)
  const [username, setUsername] = useState(SETTINGS_DEFAULTS.username)
  const [email, setEmail] = useState(SETTINGS_DEFAULTS.email)
  const [phone, setPhone] = useState(SETTINGS_DEFAULTS.phone)
  const [avatarSource, setAvatarSource] = useState<ProfileAvatarSource | null>(null)
  const [photoSheetOpen, setPhotoSheetOpen] = useState(false)
  const [pickingPhoto, setPickingPhoto] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadFields = useCallback(async () => {
    const profile = await loadAccountProfile(mockUser.level)
    setDisplayName(profile.displayName)
    setUsername(profile.username)
    setEmail(profile.email)
    setPhone(profile.phone)
    setAvatarSource(null)
  }, [])

  useEffect(() => {
    void loadFields()
  }, [loadFields])

  const handleOpenPhotoSheet = () => {
    if (!pickingPhoto) setPhotoSheetOpen(true)
  }

  const handlePickPhoto = async (source: 'camera' | 'library' | 'random') => {
    setPhotoSheetOpen(false)
    setPickingPhoto(true)
    try {
      const next = await saveProfilePhotoFromSource(source)
      if (next) setAvatarSource(next)
    } finally {
      setPickingPhoto(false)
    }
  }

  const handleSave = async () => {
    const trimmedName = displayName.trim()
    const trimmedUser = username.trim().replace(/^@/, '')
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()
    if (!trimmedName || !trimmedUser) {
      Alert.alert('Missing info', 'Add a display name and username.')
      return
    }
    if (trimmedEmail && !trimmedEmail.includes('@')) {
      Alert.alert('Check email', 'Enter a valid email address.')
      return
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
          <Button label={saving ? 'Saving…' : 'Save changes'} onPress={() => void handleSave()} />
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
            borderColor={colors.card}
            borderWidth={3}
          />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={handleOpenPhotoSheet} disabled={pickingPhoto}>
          <Text style={styles.changePhoto}>{pickingPhoto ? 'Opening…' : 'Change photo'}</Text>
        </Pressable>
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Display name</Text>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor={colors.dim}
          style={styles.input}
          autoCapitalize="words"
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Username</Text>
        <View style={styles.usernameRow}>
          <Text style={styles.atSign}>@</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="handle"
            placeholderTextColor={colors.dim}
            style={[styles.input, styles.usernameInput]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
          />
        </View>
      </View>

      <Text style={[styles.fieldLabel, styles.sectionGap]}>Contact</Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="you@email.com"
          placeholderTextColor={colors.dim}
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="emailAddress"
          returnKeyType="next"
        />
      </View>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          placeholderTextColor={colors.dim}
          style={styles.input}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
          returnKeyType="done"
        />
      </View>
    </SettingsDetailShell>

    <ProfilePhotoPickerSheet
      visible={photoSheetOpen}
      onClose={() => setPhotoSheetOpen(false)}
      onSelectCamera={() => void handlePickPhoto('camera')}
      onSelectLibrary={() => void handlePickPhoto('library')}
      onSelectRandom={() => void handlePickPhoto('random')}
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingLeft: space[16],
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
