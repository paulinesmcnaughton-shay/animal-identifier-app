import Svg, { Defs, Path, RadialGradient, Stop } from 'react-native-svg'

import { colors } from '@/design/tokens'

const SIZE = 112
const CENTER = SIZE / 2
const RADIUS = 50
const HALF_SPREAD = 34

function wedgePath(cx: number, cy: number, r: number, halfSpreadDeg: number): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const start = toRad(-90 - halfSpreadDeg)
  const end = toRad(-90 + halfSpreadDeg)
  const x1 = cx + r * Math.cos(start)
  const y1 = cy + r * Math.sin(start)
  const x2 = cx + r * Math.cos(end)
  const y2 = cy + r * Math.sin(end)
  const largeArc = halfSpreadDeg * 2 > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`
}

export function UserHeadingBeam() {
  return (
    <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
      <Defs>
        <RadialGradient id="wildrHeadingBeam" cx="50%" cy="42%" rx="52%" ry="52%">
          <Stop offset="0%" stopColor={colors.green} stopOpacity={0.42} />
          <Stop offset="55%" stopColor={colors.green} stopOpacity={0.16} />
          <Stop offset="100%" stopColor={colors.green} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d={wedgePath(CENTER, CENTER, RADIUS, HALF_SPREAD)} fill="url(#wildrHeadingBeam)" />
    </Svg>
  )
}
