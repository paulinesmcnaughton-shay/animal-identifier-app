import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

import { ToggleSwitch } from '@/design/atoms/ToggleSwitch'
import { colors, radius, space, type as typeTokens } from '@/design/tokens'

interface SightingsSharingFieldsProps {
  shareFindings: boolean
  showUsername: boolean
  onShareFindingsChange: (value: boolean) => void
  onShowUsernameChange: (value: boolean) => void
  variant?: 'onboarding' | 'settings'
}

export function SightingsSharingFields({
  shareFindings,
  showUsername,
  onShareFindingsChange,
  onShowUsernameChange,
  variant = 'onboarding',
}: SightingsSharingFieldsProps) {
  const isSettings = variant === 'settings'

  const handleShareChange = (next: boolean) => {
    onShareFindingsChange(next)
    if (!next) onShowUsernameChange(false)
  }

  if (isSettings) {
    return (
      <View style={styles.settingsWrap}>
        <Text style={styles.settingsIntro}>
          Control whether your spots appear on the Nearby map for other explorers, and whether your username is shown.
        </Text>

        <View style={styles.settingsGroup}>
          <SharingToggleRow
            icon="map"
            iconBg={colors.sky}
            title="Share on Nearby map"
            subtitle="Your spots appear on the map when you add a species"
            value={shareFindings}
            onToggle={handleShareChange}
          />
          <SharingToggleRow
            icon="at"
            iconBg={colors.plum}
            title="Show my username"
            subtitle="Uncheck to share anonymously — others see what, not who"
            value={showUsername}
            onToggle={onShowUsernameChange}
            disabled={!shareFindings}
            isLast
          />
        </View>
      </View>
    )
  }

  return (
    <View style={styles.onboardingWrap}>
      <Text style={styles.onboardingLabel}>Sharing on the Nearby Map</Text>

      <SharingCheckboxRow
        checked={showUsername}
        onToggle={() => onShowUsernameChange(!showUsername)}
        title="Show my username on published findings"
        subtitle="You can change this anytime in Settings or per finding from the GPS icon."
      />

      <View style={styles.familyBlock}>
        <Text style={styles.familyTitle}>Captures are private unless you publish them</Text>
        <Text style={styles.onboardingBody}>
          When you take a photo, you can choose to share it on the Nearby Map. Before publishing, you can review or move the location pin.
        </Text>
      </View>

      <View style={styles.familyBlock}>
        <Text style={styles.familyTitle}>Family location stays private</Text>
        <Text style={styles.onboardingBody}>
          If you're using a family account, parents may be able to see where captures were taken, but this does not publish them to the public map.
        </Text>
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
      <ToggleSwitch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
      />
    </Pressable>
  )
}

// ─── Onboarding checkbox row (unchanged behaviour) ────────────────────────────

interface SharingCheckboxRowProps {
  checked: boolean
  onToggle: () => void
  title: string
  subtitle: string
  disabled?: boolean
  indented?: boolean
}

function SharingCheckboxRow({
  checked,
  onToggle,
  title,
  subtitle,
  disabled,
  indented,
}: SharingCheckboxRowProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onToggle}
      style={[
        styles.checkRow,
        indented && styles.checkRowIndented,
        disabled && styles.checkRowDisabled,
      ]}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={disabled ? colors.dim : checked ? colors.green : colors.ink2}
      />
      <View style={styles.checkText}>
        <Text style={[styles.checkTitle, disabled && styles.checkTitleDisabled]}>{title}</Text>
        <Text style={[styles.checkSub, disabled && styles.checkSubDisabled]}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  // ── Settings variant ──────────────────────────────────
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

  // ── Onboarding variant ────────────────────────────────
  onboardingWrap: {
    gap: space[8],
    marginBottom: space[24],
  },
  onboardingLabel: {
    fontSize: typeTokens.size.label,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  onboardingBody: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 20,
  },
  familyBlock: {
    gap: space[4],
  },
  familyTitle: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    paddingVertical: space[4],
  },
  checkRowIndented: {
    marginLeft: space[8],
  },
  checkRowDisabled: {
    opacity: 0.55,
  },
  checkText: {
    flex: 1,
    gap: space[4],
  },
  checkTitle: {
    fontSize: typeTokens.size.body,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
  },
  checkTitleDisabled: {
    color: colors.dim,
  },
  checkSub: {
    fontSize: typeTokens.size.bodySM,
    fontWeight: typeTokens.body.weights.medium,
    color: colors.dim,
    lineHeight: 20,
  },
  checkSubDisabled: {
    color: colors.hairline,
  },
})
