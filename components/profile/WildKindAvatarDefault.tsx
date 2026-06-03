import Svg, { Circle, Defs, G, LinearGradient, Path, Stop, Text } from 'react-native-svg'

interface Props {
  size: number
}

export function WildKindAvatarDefault({ size }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="wk-bg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFE3C4" />
          <Stop offset="1" stopColor="#FFC79A" />
        </LinearGradient>
      </Defs>

      <Circle cx="256" cy="256" r="256" fill="url(#wk-bg)" />

      <G transform="translate(256, 222)">
        <Path d="M-118 -78 L-58 -28 L-104 6 Z" fill="#E8743B" />
        <Path d="M118 -78 L58 -28 L104 6 Z" fill="#E8743B" />
        <Path d="M-104 -58 L-70 -28 L-96 -8 Z" fill="#3A2D27" />
        <Path d="M104 -58 L70 -28 L96 -8 Z" fill="#3A2D27" />

        <Path
          d="M-104 -34 C-104 36 -58 96 0 96 C58 96 104 36 104 -34 C104 -64 68 -78 0 -78 C-68 -78 -104 -64 -104 -34 Z"
          fill="#F2823F"
        />
        <Path
          d="M-72 6 C-72 56 -34 92 0 92 C34 92 72 56 72 6 C72 6 36 22 0 22 C-36 22 -72 6 -72 6 Z"
          fill="#FFF4E8"
        />

        <Circle cx="-42" cy="2" r="13" fill="#3A2D27" />
        <Circle cx="42" cy="2" r="13" fill="#3A2D27" />
        <Circle cx="-38" cy="-2" r="4" fill="#FFFFFF" />
        <Circle cx="46" cy="-2" r="4" fill="#FFFFFF" />

        <Path
          d="M-13 44 C-13 56 0 64 0 64 C0 64 13 56 13 44 C13 36 6 32 0 32 C-6 32 -13 36 -13 44 Z"
          fill="#3A2D27"
        />
      </G>

      <Text
        x="256"
        y="438"
        textAnchor="middle"
        fontFamily="Nunito, Trebuchet MS, sans-serif"
        fontSize="58"
        fontWeight="700"
        fill="#3A2D27"
      >
        WildKind
      </Text>
    </Svg>
  )
}
