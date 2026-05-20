import { Ionicons } from '@expo/vector-icons'
import { type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'

import { screenLayout } from '@/design/screen-layout'
import { colors, space, type as typeTokens } from '@/design/tokens'

interface ScreenHeaderProps {
  onBack: () => void
  /** Back arrow by default; use `close` after capture flow */
  leadingAction?: 'back' | 'close'
  title?: string
  center?: ReactNode
  right?: ReactNode
  style?: StyleProp<ViewStyle>
}

interface ScreenHeaderIconButtonProps {
  accessibilityLabel: string
  icon: keyof typeof Ionicons.glyphMap
  onPress: () => void
}

export function ScreenHeaderIconButton({
  accessibilityLabel,
  icon,
  onPress,
}: ScreenHeaderIconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
      <Ionicons name={icon} size={screenLayout.iconSize} color={colors.ink} />
    </Pressable>
  )
}

export function ScreenHeader({
  onBack,
  leadingAction = 'back',
  title,
  center,
  right,
  style,
}: ScreenHeaderProps) {
  const centerContent =
    center ??
    (title ? (
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
    ) : null)

  const leadingIcon = leadingAction === 'close' ? 'close' : 'arrow-back'
  const leadingLabel = leadingAction === 'close' ? 'Close' : 'Go back'

  return (
    <View style={[styles.header, style]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={leadingLabel}
        style={({ pressed }) => [styles.iconBtn, pressed && styles.iconBtnPressed]}>
        <Ionicons name={leadingIcon} size={screenLayout.iconSize} color={colors.ink} />
      </Pressable>

      {centerContent ? <View style={styles.center}>{centerContent}</View> : <View style={styles.flex} />}

      {right ?? <View style={styles.iconBtn} />}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: screenLayout.padH,
    paddingTop: screenLayout.headerTop,
    paddingBottom: screenLayout.headerPadV,
    backgroundColor: colors.bg,
  },
  iconBtn: {
    width: screenLayout.iconBtnSize,
    height: screenLayout.iconBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnPressed: {
    opacity: screenLayout.iconPressedOpacity,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[8],
  },
  flex: {
    flex: 1,
  },
  title: {
    fontSize: typeTokens.size.title,
    fontWeight: typeTokens.body.weights.bold,
    color: colors.ink,
    textAlign: 'center',
  },
})
