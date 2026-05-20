import { useRouter } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import { SettingsDetailShell } from '@/components/settings/SettingsDetailShell'
import { SettingsOptionGroup } from '@/components/settings/SettingsOptionGroup'
import { SettingsToggleRow } from '@/components/settings/SettingsToggleRow'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'
import {
  STREAK_REMINDER_TIME_OPTIONS,
  type StreakReminderTime,
  loadSettingsPreferences,
  saveNotifyBadgeUnlocked,
  saveNotifyNewSpecies,
  saveNotifyWeeklyQuest,
  saveStreakReminder,
  saveStreakReminderTime,
} from '@/features/settings/preferences'

export function NotificationSettingsScreenContent() {
  const router = useRouter()
  const [streakReminder, setStreakReminder] = useState(true)
  const [streakReminderTime, setStreakReminderTime] = useState<StreakReminderTime>('19:00')
  const [notifyNewSpecies, setNotifyNewSpecies] = useState(true)
  const [notifyBadgeUnlocked, setNotifyBadgeUnlocked] = useState(true)
  const [notifyWeeklyQuest, setNotifyWeeklyQuest] = useState(true)

  const load = useCallback(async () => {
    const prefs = await loadSettingsPreferences()
    setStreakReminder(prefs.streakReminder)
    setStreakReminderTime(prefs.streakReminderTime)
    setNotifyNewSpecies(prefs.notifyNewSpecies)
    setNotifyBadgeUnlocked(prefs.notifyBadgeUnlocked)
    setNotifyWeeklyQuest(prefs.notifyWeeklyQuest)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <SettingsDetailShell title="Notifications" onBack={() => router.back()}>
      <Text style={styles.sectionLabel}>REMINDERS</Text>
      <View style={styles.group}>
        <SettingsToggleRow
          title="Daily streak reminder"
          subtitle="Keep your spotting streak alive"
          value={streakReminder}
          onValueChange={(v) => {
            setStreakReminder(v)
            void saveStreakReminder(v)
          }}
          isLast={!streakReminder}
        />
      </View>

      {streakReminder ? (
        <>
          <Text style={styles.sectionLabel}>REMINDER TIME</Text>
          <SettingsOptionGroup
            options={STREAK_REMINDER_TIME_OPTIONS}
            value={streakReminderTime}
            onSelect={(next) => {
              setStreakReminderTime(next)
              void saveStreakReminderTime(next)
            }}
          />
        </>
      ) : null}

      <Text style={styles.sectionLabel}>ACTIVITY</Text>
      <View style={styles.group}>
        <SettingsToggleRow
          title="New species spotted"
          subtitle="XP and dex unlocks"
          value={notifyNewSpecies}
          onValueChange={(v) => {
            setNotifyNewSpecies(v)
            void saveNotifyNewSpecies(v)
          }}
        />
        <SettingsToggleRow
          title="Badge unlocked"
          subtitle="Kingdom and milestone medals"
          value={notifyBadgeUnlocked}
          onValueChange={(v) => {
            setNotifyBadgeUnlocked(v)
            void saveNotifyBadgeUnlocked(v)
          }}
        />
        <SettingsToggleRow
          title="Weekly quest updates"
          subtitle="Progress and rewards"
          value={notifyWeeklyQuest}
          onValueChange={(v) => {
            setNotifyWeeklyQuest(v)
            void saveNotifyWeeklyQuest(v)
          }}
          isLast
        />
      </View>
    </SettingsDetailShell>
  )
}

const styles = StyleSheet.create({
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
})
