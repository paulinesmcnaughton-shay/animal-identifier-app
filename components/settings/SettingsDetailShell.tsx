import { type ReactNode } from 'react'
import { ScrollView, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { ScreenHeader } from '@/design/atoms/ScreenHeader'
import { screenLayout } from '@/design/screen-layout'
import { colors, space, type as typeTokens } from '@/design/tokens'

interface SettingsDetailShellProps {
  title: string
  onBack: () => void
  children: ReactNode
  footer?: ReactNode
  sectionLabel?: string
  contentStyle?: StyleProp<ViewStyle>
}

export function SettingsDetailShell({
  title,
  onBack,
  children,
  footer,
  sectionLabel,
  contentStyle,
}: SettingsDetailShellProps) {
  const insets = useSafeAreaInsets()

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <ScreenHeader onBack={onBack} title={title} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + space[24] },
          contentStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {sectionLabel ? <Text style={styles.sectionLabel}>{sectionLabel}</Text> : null}
        {children}
        {footer}
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
    marginTop: space[8],
    marginLeft: space[4],
  },
})
