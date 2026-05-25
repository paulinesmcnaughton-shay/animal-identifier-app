import { StyleSheet, Text, type TextStyle } from 'react-native'

import {
  PROFILE_DISPLAY_NAME_MAX_LENGTH,
  truncateProfileDisplayName,
} from '@/features/profile/display-name-label'

interface ProfileDisplayNameProps {
  displayName: string
  style?: TextStyle
}

export function ProfileDisplayName({ displayName, style }: ProfileDisplayNameProps) {
  const trimmed = displayName.trim()
  const visible = truncateProfileDisplayName(trimmed)
  const isTruncated = trimmed.length > PROFILE_DISPLAY_NAME_MAX_LENGTH

  return (
    <Text
      style={[styles.name, style]}
      numberOfLines={1}
      ellipsizeMode="tail"
      accessibilityLabel={isTruncated ? trimmed : undefined}>
      {visible}
    </Text>
  )
}

const styles = StyleSheet.create({
  name: {
    flexShrink: 1,
    minWidth: 0,
  },
})
