import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { colors, radius, space, type as typeTokens } from '@/design/tokens'
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
        <Switch
          value={action.value}
          onValueChange={action.onToggle}
          trackColor={{ false: colors.hairline, true: colors.green }}
          thumbColor={colors.card}
        />
      )}
    </Pressable>
  )
}

export function SettingsScreenContent() {
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [autoRecordSounds, setAutoRecordSounds] = useState(true)
  const [autoTagLocation, setAutoTagLocation] = useState(true)
  const [vibrateOnIdentify, setVibrateOnIdentify] = useState(false)
  const [useScientificNames, setUseScientificNames] = useState(false)

  const handleLogout = async () => {
    await storage.delete('isLoggedIn')
    router.replace('/welcome')
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 60 + space[40] }]}
        showsVerticalScrollIndicator={false}>

        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <SettingsRow icon="person" iconBg={colors.green} title="Alex Riley" subtitle="@alexinthewild · Level 14" action={{ type: 'chevron' }} />
          <SettingsRow icon="star" iconBg={colors.coral} title="Wildr Pro" subtitle="Unlock unlimited IDs & sounds" action={{ type: 'chevron' }} />
          <SettingsRow icon="notifications" iconBg={colors.sun} title="Notifications" subtitle="Daily streak reminder · 7:00pm" action={{ type: 'chevron' }} isLast />
        </View>

        <Text style={styles.sectionLabel}>Capture</Text>
        <View style={styles.group}>
          <SettingsRow icon="camera" iconBg={colors.sky} title="Camera quality" subtitle="High (12 MP)" action={{ type: 'chevron' }} />
          <SettingsRow icon="volume-high" iconBg={colors.plum} title="Auto-record sounds" action={{ type: 'toggle', value: autoRecordSounds, onToggle: setAutoRecordSounds }} />
          <SettingsRow icon="location" iconBg={colors.coral} title="Auto-tag location" action={{ type: 'toggle', value: autoTagLocation, onToggle: setAutoTagLocation }} />
          <SettingsRow icon="flash" iconBg={colors.sun} title="Vibrate on identify" action={{ type: 'toggle', value: vibrateOnIdentify, onToggle: setVibrateOnIdentify }} isLast />
        </View>

        <Text style={styles.sectionLabel}>Display</Text>
        <View style={styles.group}>
          <SettingsRow icon="sunny" iconBg={colors.sun} title="Appearance" subtitle="Light" action={{ type: 'chevron' }} />
          <SettingsRow icon="leaf" iconBg={colors.green} title="Use scientific names" action={{ type: 'toggle', value: useScientificNames, onToggle: setUseScientificNames }} />
          <SettingsRow icon="grid" iconBg={colors.plum} title="Dex layout" subtitle="Grid · 3 columns" action={{ type: 'chevron' }} isLast />
        </View>

        <Text style={styles.sectionLabel}>Privacy & Data</Text>
        <View style={styles.group}>
          <SettingsRow icon="eye" iconBg={colors.green} title="Sightings visibility" subtitle="Public" action={{ type: 'chevron' }} isLast />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[12],
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    textAlign: 'center',
  },
  scroll: {
    paddingHorizontal: space[16],
  },
  sectionLabel: {
    fontSize: typeTokens.size.micro,
    fontWeight: typeTokens.body.weights.black,
    color: colors.dim,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: space[8],
    marginTop: space[20],
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
    paddingHorizontal: space[14],
    paddingVertical: space[12],
    gap: space[12],
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
  logoutWrap: {
    marginTop: space[32],
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
