import * as Haptics from 'expo-haptics'

export function hapticLight() {
  void Haptics.selectionAsync()
}

export function hapticMedium() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}
