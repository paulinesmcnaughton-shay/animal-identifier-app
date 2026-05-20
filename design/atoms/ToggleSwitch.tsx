import { Switch, type SwitchProps } from 'react-native'

import { colors } from '@/design/tokens'

type ToggleSwitchProps = Omit<SwitchProps, 'ios_backgroundColor' | 'thumbColor' | 'trackColor'>

/** Wildr toggle — off: `colors.switchOff`, on: `colors.greenLight`. */
export function ToggleSwitch(props: ToggleSwitchProps) {
  return (
    <Switch
      trackColor={{ false: colors.switchOff, true: colors.greenLight }}
      ios_backgroundColor={colors.switchOff}
      thumbColor={colors.card}
      {...props}
    />
  )
}
