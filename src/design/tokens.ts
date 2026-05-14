export const color = {
  // Brand
  green: '#15B981',
  greenDark: '#0E8F65',
  lime: '#A4DE3A',

  // Accents
  coral: '#FF6B5B',
  coralDeep: '#E04A39',
  sun: '#FFC93C',
  sky: '#5BC0EB',
  plum: '#A855F7',
  earth: '#92633A',

  // Neutrals
  ink: '#152130',
  ink2: '#33455A',
  dim: '#7388A0',
  hair: '#E7EDF3',
  bg: '#FAF7F0',
  bg2: '#FFFBF0',
  card: '#FFFFFF',
  black: '#000000',
} as const

/** @deprecated Prefer `color` from the design doc; kept for existing `colors.*` imports */
export const colors = {
  ...color,
  hairline: color.hair,
  skyDeep: '#2A8FB8',
  earthLight: '#D4B896',
} as const

export const space = { 2:2, 4:4, 6:6, 8:8, 10:10, 12:12, 14:14, 16:16, 20:20, 24:24, 28:28, 32:32, 40:40, 56:56 } as const

export const radius = { sm:8, md:14, lg:18, xl:22, xxl:28, pill:999 } as const

export const type = {
  display: { family: 'BricolageGrotesque-ExtraBold', weight: '800' as const },
  body: { family: 'Nunito', weights: { regular:'400', medium:'500', bold:'700', extra:'800', black:'900' } },
  size: { displayXL:48, displayLG:36, displayMD:30, displaySM:22, title:18, bodyLG:17, body:15, bodySM:14, label:13, caption:12, micro:11 },
} as const
