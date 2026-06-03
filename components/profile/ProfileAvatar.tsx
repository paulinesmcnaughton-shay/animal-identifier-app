import { Image, type ImageProps } from 'expo-image'
import { useEffect, useState } from 'react'
import { View, type StyleProp, type ViewStyle } from 'react-native'

import { WildKindAvatarDefault } from '@/components/profile/WildKindAvatarDefault'
import { subscribeAccountProfile } from '@/features/settings/account-profile-events'
import {
  type ProfileAvatarSource,
  resolveProfileAvatarSource,
} from '@/features/settings/profile-avatar'

interface ProfileAvatarProps {
  size: number
  style?: StyleProp<ViewStyle>
  imageStyle?: ImageProps['style']
  borderColor?: string
  borderWidth?: number
  /** When set, skips async load (e.g. right after picker). */
  source?: ProfileAvatarSource | null
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
        .catch(() => setSource(null))
    }
    refresh()
    return subscribeAccountProfile(refresh)
  }, [sourceOverride])

  const circleStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth,
    borderColor,
    overflow: 'hidden' as const,
  }

  if (!source) {
    return (
      <View style={[circleStyle, style]}>
        <WildKindAvatarDefault size={size} />
      </View>
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
      onError={() => setSource(null)}
      cachePolicy={isRemote ? 'memory-disk' : 'memory'}
      accessibilityIgnoresInvertColors
    />
  )
}
