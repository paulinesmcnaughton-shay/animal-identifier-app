import { Ionicons } from '@expo/vector-icons'
import { Pressable, StyleSheet, Text, View } from 'react-native'

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

  return (
    <View style={[styles.wrap, isSettings && styles.wrapSettings]}>
      {!isSettings ? (
        <Text style={styles.sectionLabel}>Sharing on the Nearby map</Text>
      ) : null}
      {isSettings ? (
        <Text style={styles.settingsIntro}>
          Control whether your spots appear on the Nearby map for other explorers, and
          whether your username is shown.
        </Text>
      ) : null}

      <SharingCheckboxRow
        checked={shareFindings}
        onToggle={() => handleShareChange(!shareFindings)}
        title="Share your findings with other users"
        subtitle="Shows on the Nearby map when you add a species to your collection"
        variant={variant}
      />

      <SharingCheckboxRow
        checked={showUsername}
        onToggle={() => onShowUsernameChange(!showUsername)}
        title="Show my username on the map"
        subtitle="Uncheck to share anonymously — others see what you found, not who you are"
        variant={variant}
        disabled={!shareFindings}
        indented
        isLast={isSettings}
      />
    </View>
  )
}

interface SharingCheckboxRowProps {
  checked: boolean
  onToggle: () => void
  title: string
  subtitle: string
  variant: 'onboarding' | 'settings'
  disabled?: boolean
  indented?: boolean
  isLast?: boolean
}

function SharingCheckboxRow({
  checked,
  onToggle,
  title,
  subtitle,
  variant,
  disabled,
  indented,
  isLast,
}: SharingCheckboxRowProps) {
  const isSettings = variant === 'settings'

  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: !!disabled }}
      accessibilityLabel={title}
      disabled={disabled}
      onPress={onToggle}
      style={({ pressed }) => [
        styles.row,
        isSettings && styles.rowSettings,
        isSettings && isLast && styles.rowSettingsLast,
        indented && styles.rowIndented,
        disabled && styles.rowDisabled,
        pressed && !disabled && styles.rowPressed,
      ]}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={22}
        color={disabled ? colors.dim : checked ? colors.green : colors.ink2}
      />
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, disabled && styles.rowTitleDisabled]}>{title}</Text>
        <Text style={[styles.rowSub, disabled && styles.rowSubDisabled]}>{subtitle}</Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: space[8],
    marginBottom: space[24],
  },
  wrapSettings: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: 0,
  },
  sectionLabel: {
    fontSize: typeTokens.size.label,
    fontFamily: 'Nunito_700Bold',
    color: colors.ink2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsIntro: {
    fontSize: typeTokens.size.body,
    fontFamily: 'Nunito_400Regular',
    color: colors.dim,
    paddingHorizontal: space[16],
    paddingTop: space[16],
    paddingBottom: space[8],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space[8],
    paddingVertical: space[4],
  },
  rowSettings: {
    paddingHorizontal: space[16],
    paddingVertical: space[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowSettingsLast: {
    borderBottomWidth: 0,
  },
  rowIndented: {
    marginLeft: space[8],
    paddingTop: 0,
  },
  rowDisabled: {
    opacity: 0.55,
  },
  rowPressed: {
    opacity: 0.85,
  },
  rowText: {
    flex: 1,
    gap: space[4],
  },
  rowTitle: {
    fontSize: typeTokens.size.body,
    fontFamily: 'Nunito_700Bold',
    color: colors.ink,
  },
  rowTitleDisabled: {
    color: colors.dim,
  },
  rowSub: {
    fontSize: typeTokens.size.bodySM,
    fontFamily: 'Nunito_400Regular',
    color: colors.dim,
    lineHeight: 20,
  },
  rowSubDisabled: {
    color: colors.hairline,
  },
})
