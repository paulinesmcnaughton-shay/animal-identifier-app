import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/design/atoms/ScreenHeader'
import { ToggleSwitch } from '@/design/atoms/ToggleSwitch'
import { screenLayout } from '@/design/screen-layout'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  connectInaturalistAccount,
  disconnectInaturalistAccount,
  getInaturalistRedirectUri,
  getInaturalistStatusLabel,
  isInaturalistConnected,
  openInaturalistTokenPage,
  saveInaturalistApiToken,
} from '@/features/identify/inaturalist-auth'
import { IdentifyError } from '@/features/identify/types'
import {
  formatAccountSubtitle,
  useAccountProfile,
} from '@/features/settings/account-profile'
import {
  SETTINGS_DEFAULTS,
  loadSettingsPreferences,
  saveAutoRecordSounds,
  saveAutoTagLocation,
  saveUseScientificNames,
  saveVibrateOnIdentify,
  settingsRowSubtitles,
  type SettingsRowSubtitles,
} from '@/features/settings/preferences'
import { mockUser } from '@/data/mock'
import { storage } from '@/util/storage'

type RowAction =
  | { type: 'chevron'; onPress?: () => void }
  | { type: 'toggle'; value: boolean; onToggle: (v: boolean) => void }

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  title: string
  subtitle?: string
  action: RowAction
  isLast?: boolean
}

function SettingsRow({ icon, iconBg, title, subtitle, action, isLast }: RowProps) {
  const handlePress = () => {
    if (action.type === 'chevron') action.onPress?.()
    if (action.type === 'toggle') action.onToggle(!action.value)
  }

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, !isLast && styles.rowBorder, pressed && styles.rowPressed]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={colors.card} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        {subtitle ? <Text style={styles.rowSub}>{subtitle}</Text> : null}
      </View>
      {action.type === 'chevron' && (
        <Ionicons name="chevron-forward" size={17} color={colors.dim} />
      )}
      {action.type === 'toggle' && (
        <ToggleSwitch value={action.value} onValueChange={action.onToggle} />
      )}
    </Pressable>
  )
}

export function SettingsScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const { displayName, username } = useAccountProfile()
  const [rowSubtitles, setRowSubtitles] = useState<SettingsRowSubtitles>(() =>
    settingsRowSubtitles({
      displayName: SETTINGS_DEFAULTS.displayName,
      username: SETTINGS_DEFAULTS.username,
      email: SETTINGS_DEFAULTS.email,
      phone: SETTINGS_DEFAULTS.phone,
      cameraQuality: 'high',
      appearance: 'light',
      dexLayout: 'grid-3',
      sightingsVisibility: 'public',
      streakReminder: true,
      streakReminderTime: '19:00',
      notifyNewSpecies: true,
      notifyBadgeUnlocked: true,
      notifyWeeklyQuest: true,
      autoRecordSounds: true,
      autoTagLocation: true,
      vibrateOnIdentify: false,
      useScientificNames: false,
    }),
  )
  const [autoRecordSounds, setAutoRecordSounds] = useState(true)
  const [autoTagLocation, setAutoTagLocation] = useState(true)
  const [vibrateOnIdentify, setVibrateOnIdentify] = useState(false)
  const [useScientificNames, setUseScientificNames] = useState(false)
  const [inatConnected, setInatConnected] = useState(false)
  const [inatStatus, setInatStatus] = useState('Paste token from iNaturalist (~24h)')
  const [inatBusy, setInatBusy] = useState(false)

  const refreshInatStatus = useCallback(async () => {
    setInatConnected(await isInaturalistConnected())
    setInatStatus(await getInaturalistStatusLabel())
  }, [])

  const refreshPreferences = useCallback(async () => {
    const prefs = await loadSettingsPreferences(mockUser.level)
    setRowSubtitles(settingsRowSubtitles(prefs, mockUser.level))
    setAutoRecordSounds(prefs.autoRecordSounds)
    setAutoTagLocation(prefs.autoTagLocation)
    setVibrateOnIdentify(prefs.vibrateOnIdentify)
    setUseScientificNames(prefs.useScientificNames)
  }, [])

  useEffect(() => {
    void refreshInatStatus()
  }, [refreshInatStatus])

  useFocusEffect(
    useCallback(() => {
      void refreshPreferences()
    }, [refreshPreferences]),
  )

  const handlePasteInaturalistToken = () => {
    Alert.prompt(
      'Paste iNaturalist token',
      'Open the token page, copy the long string, paste here. Lasts ~24 hours. No .env edit needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (text) => {
            void (async () => {
              setInatBusy(true)
              try {
                await saveInaturalistApiToken(text ?? '')
                await refreshInatStatus()
                Alert.alert('Saved', 'You can scan wildlife and plants now.')
              } catch (error) {
                const message =
                  error instanceof IdentifyError ? error.message : 'Invalid token.'
                Alert.alert('Could not save', message)
              } finally {
                setInatBusy(false)
              }
            })()
          },
        },
      ],
      'plain-text',
    )
  }

  const handleConnectInaturalist = () => {
    const tryOAuth = () => {
      void (async () => {
        setInatBusy(true)
        try {
          await connectInaturalistAccount()
          await refreshInatStatus()
          Alert.alert('Connected', 'Wildr will refresh your iNaturalist access automatically.')
        } catch (error) {
          const message =
            error instanceof IdentifyError
              ? error.message
              : 'Could not connect. Use paste token instead.'
          const redirect = getInaturalistRedirectUri()
          Alert.alert(
            'OAuth failed',
            `${message}\n\nIf you get “no permission” on iNaturalist, use Paste token instead.\n\nRedirect URI (after approval):\n${redirect}`,
          )
        } finally {
          setInatBusy(false)
        }
      })()
    }

    if (inatConnected) {
      Alert.alert('iNaturalist', inatStatus, [
        { text: 'Update token', onPress: handlePasteInaturalistToken },
        { text: 'Open token page', onPress: () => void openInaturalistTokenPage() },
        { text: 'OAuth sign-in', onPress: tryOAuth },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setInatBusy(true)
              try {
                await disconnectInaturalistAccount()
                await refreshInatStatus()
              } finally {
                setInatBusy(false)
              }
            })()
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }

    Alert.alert(
      'iNaturalist setup',
      'iNaturalist blocks new OAuth apps until you are an “App Owner.” Use paste token instead — free, no permission needed.',
      [
        { text: 'Open token page', onPress: () => void openInaturalistTokenPage() },
        { text: 'Paste token', onPress: handlePasteInaturalistToken },
        { text: 'Try OAuth', onPress: tryOAuth },
        { text: 'Cancel', style: 'cancel' },
      ],
    )
  }

  const handleLogout = async () => {
    await storage.delete('isLoggedIn')
    router.replace('/welcome')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={() => router.back()} title="Settings" />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + space[24] }]}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="person"
            iconBg={colors.greenLight}
            title={displayName}
            subtitle={formatAccountSubtitle(username)}
            action={{ type: 'chevron', onPress: () => router.push('/settings-account') }}
          />
          <SettingsRow
            icon="star"
            iconBg={colors.coral}
            title="Wildr Pro"
            subtitle="Unlock unlimited IDs & sounds"
            action={{ type: 'chevron', onPress: () => router.push('/settings-wildr-pro') }}
          />
          <SettingsRow
            icon="notifications"
            iconBg={colors.sun}
            title="Notifications"
            subtitle={rowSubtitles.notifications}
            action={{ type: 'chevron', onPress: () => router.push('/settings-notifications') }}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>Capture</Text>
        <View style={styles.group}>
          <Pressable
            onPress={handleConnectInaturalist}
            disabled={inatBusy}
            accessibilityRole="button"
            accessibilityLabel={inatConnected ? 'Disconnect iNaturalist' : 'Connect iNaturalist'}
            style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.rowPressed]}>
            <View style={[styles.iconWrap, { backgroundColor: colors.greenLight }]}>
              <Ionicons name="leaf" size={19} color={colors.card} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>iNaturalist</Text>
              <Text style={styles.rowSub}>{inatStatus}</Text>
            </View>
            {inatBusy ? (
              <ActivityIndicator color={colors.greenLight} />
            ) : (
              <Text style={styles.inatAction}>{inatConnected ? 'Manage' : 'Set up'}</Text>
            )}
          </Pressable>
          <SettingsRow
            icon="camera"
            iconBg={colors.sky}
            title="Camera quality"
            subtitle={rowSubtitles.cameraQuality}
            action={{ type: 'chevron', onPress: () => router.push('/settings-camera-quality') }}
          />
          <SettingsRow
            icon="volume-high"
            iconBg={colors.plum}
            title="Auto-record sounds"
            action={{
              type: 'toggle',
              value: autoRecordSounds,
              onToggle: (v) => {
                setAutoRecordSounds(v)
                void saveAutoRecordSounds(v)
              },
            }}
          />
          <SettingsRow
            icon="location"
            iconBg={colors.coral}
            title="Auto-tag location"
            action={{
              type: 'toggle',
              value: autoTagLocation,
              onToggle: (v) => {
                setAutoTagLocation(v)
                void saveAutoTagLocation(v)
              },
            }}
          />
          <SettingsRow
            icon="flash"
            iconBg={colors.sun}
            title="Vibrate on identify"
            action={{
              type: 'toggle',
              value: vibrateOnIdentify,
              onToggle: (v) => {
                setVibrateOnIdentify(v)
                void saveVibrateOnIdentify(v)
              },
            }}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>Display</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="sunny"
            iconBg={colors.sun}
            title="Appearance"
            subtitle={rowSubtitles.appearance}
            action={{ type: 'chevron', onPress: () => router.push('/settings-appearance') }}
          />
          <SettingsRow
            icon="leaf"
            iconBg={colors.greenLight}
            title="Use scientific names"
            action={{
              type: 'toggle',
              value: useScientificNames,
              onToggle: (v) => {
                setUseScientificNames(v)
                void saveUseScientificNames(v)
              },
            }}
          />
          <SettingsRow
            icon="grid"
            iconBg={colors.plum}
            title="Dex layout"
            subtitle={rowSubtitles.dexLayout}
            action={{ type: 'chevron', onPress: () => router.push('/settings-dex-layout') }}
            isLast
          />
        </View>

        <Text style={styles.sectionLabel}>Privacy & Data</Text>
        <View style={styles.group}>
          <SettingsRow
            icon="eye"
            iconBg={colors.greenLight}
            title="Sightings visibility"
            subtitle={rowSubtitles.sightingsVisibility}
            action={{ type: 'chevron', onPress: () => router.push('/settings-sightings-visibility') }}
            isLast
          />
        </View>

        <View style={styles.logoutWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Log out"
            onPress={handleLogout}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutPressed]}>
            <Text style={styles.logoutText}>Log Out</Text>
          </Pressable>
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: screenLayout.padH,
  },
  sectionLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[8],
    marginTop: space[16],
    marginLeft: space[4],
  },
  group: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    gap: space[16],
    backgroundColor: colors.card,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowPressed: {
    backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
  },
  rowSub: {
    fontSize: typeTokens.size.bodySM,
    color: colors.dim,
  },
  inatAction: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.greenLight,
  },
  logoutWrap: {
    marginTop: space[24],
    backgroundColor: colors.coralDeep,
    borderRadius: radius.lg,
    paddingBottom: 4,
  },
  logoutBtn: {
    backgroundColor: colors.coral,
    borderRadius: radius.lg,
    paddingVertical: space[16],
    alignItems: 'center',
  },
  logoutPressed: {
    transform: [{ translateY: 2 }],
  },
  logoutText: {
    color: colors.card,
    fontSize: typeTokens.size.displaySM,
    fontWeight: typeTokens.body.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
})
