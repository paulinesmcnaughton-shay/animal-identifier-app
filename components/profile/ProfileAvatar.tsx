import { Image, type ImageProps } from 'expo-image'
import { useEffect, useState } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { colors } from '@/design/tokens'
import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import { getAvatarPreset } from '@/features/settings/avatar-presets'
import {
  type ProfileAvatarSource,
  resolveProfileAvatarSource,
} from '@/features/settings/profile-avatar'
import { resolveAvatarPresetImage } from '@/features/settings/resolve-avatar-preset-image'
import { storage } from '@/util/storage'

const AVATAR_PRESET_ID_KEY = 'settings.avatarPresetId'

interface ProfileAvatarProps {
  size: number
  style?: StyleProp<ViewStyle>
  imageStyle?: ImageProps['style']
  borderColor?: string
  borderWidth?: number
  /** When set, skips async load (e.g. right after picker). */
  source?: ProfileAvatarSource | null
}

const BUNDLED_FALLBACK = require('@/assets/images/red-fox-hero.jpg')

async function fallbackSource(): Promise<ProfileAvatarSource> {
  const preset = getAvatarPreset(await storage.getString(AVATAR_PRESET_ID_KEY))
  if (preset) return resolveAvatarPresetImage(preset)
  return resolveProfileAvatarSource()
}

export function ProfileAvatar({
  size,
  style,
  imageStyle,
  borderColor,
  borderWidth = 0,
  source: sourceOverride,
}: ProfileAvatarProps) {
  const [source, setSource] = useState<ProfileAvatarSource | null>(
    sourceOverride ?? null,
  )

  useEffect(() => {
    const refresh = () => {
      if (sourceOverride !== undefined && sourceOverride !== null) {
        setSource(sourceOverride)
        return
      }
      void resolveProfileAvatarSource()
        .then(setSource)
        .catch(() => {
          void fallbackSource().then(setSource)
        })
    }
    refresh()
    return subscribeAccountProfile(refresh)
  }, [sourceOverride])

  if (!source) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth,
            borderColor,
            backgroundColor: colors.hairline,
          },
          imageStyle,
        ]}
      />
    )
  }

  const isRemote =
    typeof source === 'object' && 'uri' in source && source.uri.startsWith('http')

  return (
    <Image
      source={source}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth,
          borderColor,
        },
        imageStyle,
      ]}
      contentFit="cover"
      placeholder={colors.hairline}
      onError={() => {
        setSource(BUNDLED_FALLBACK)
      }}
      cachePolicy={isRemote ? 'memory-disk' : 'memory'}
      accessibilityIgnoresInvertColors
    />
  )
}
