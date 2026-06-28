import { colors } from '@/design/tokens'

import type { NotificationIcon } from './notifications'

// The icon kinds double as Ionicons glyph names; this maps each to its badge colour.
export function notificationBg(icon: NotificationIcon): string {
  switch (icon) {
    case 'sparkles':
      return colors.greenLight
    case 'ribbon':
      return colors.plum
    case 'trophy':
      return colors.coral
    case 'leaf':
      return colors.greenDeep
    case 'flame':
      return colors.coralDeep
  }
}
