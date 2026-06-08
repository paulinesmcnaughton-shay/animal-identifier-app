import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ToggleSwitch } from '@/design/atoms/ToggleSwitch'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface SightingsSharingFieldsProps {
  showUsername: boolean
  onShowUsernameChange: (value: boolean) => void
}

export function SightingsSharingFields({
  showUsername,
  onShowUsernameChange,
}: SightingsSharingFieldsProps) {
  return (
    <View style={styles.settingsWrap}>
      <Text style={styles.settingsIntro}>
        Your sightings are private by default. To share one on the Nearby map, open it and
        tap the GPS icon — you’ll confirm the location pin and choose how you appear. Nothing
        is shared automatically.
      </Text>

      <View style={styles.settingsGroup}>
        <SharingToggleRow
          icon="at"
          iconBg={colors.plum}
          title="Show my username by default"
          subtitle="When you share a sighting, start with your username shown. You can still pick anonymous each time."
          value={showUsername}
          onToggle={onShowUsernameChange}
          isLast
        />
      </View>
    </View>
  )
}

// ─── Settings toggle row (matches SettingsRow from settings-screen) ───────────

interface SharingToggleRowProps {
  icon: keyof typeof Ionicons.glyphMap
  iconBg: string
  title: string
  subtitle: string
  value: boolean
  onToggle: (next: boolean) => void
  disabled?: boolean
  isLast?: boolean
}

function SharingToggleRow({
  icon,
  iconBg,
  title,
  subtitle,
  value,
  onToggle,
  disabled,
  isLast,
}: SharingToggleRowProps) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled: !!disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={() => onToggle(!value)}
      style={({ pressed }) => [
        styles.toggleRow,
        !isLast && styles.toggleRowBorder,
        disabled && styles.toggleRowDisabled,
        pressed && !disabled && styles.toggleRowPressed,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={19} color={colors.card} />
      </View>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSub}>{subtitle}</Text>
      </View>
      <ToggleSwitch value={value} onValueChange={onToggle} disabled={disabled} />
    </Pressable>
  )
}

const styles = StyleSheet.create({
  settingsWrap: {
    gap: space[16],
  },
  settingsIntro: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 20,
    marginLeft: space[4],
  },
  settingsGroup: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    gap: space[16],
    backgroundColor: colors.card,
  },
  toggleRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  toggleRowDisabled: {
    opacity: 0.45,
  },
  toggleRowPressed: {
    backgroundColor: colors.bg,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleText: {
    flex: 1,
    gap: space[4],
  },
  toggleTitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.ink,
  },
  toggleSub: {
    fontSize: typeTokens.size.caption,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 17,
  },
})
