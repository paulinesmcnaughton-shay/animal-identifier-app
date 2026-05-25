export const colors = {
  // Brand greens — primary (dark), secondary (light), deep (button shadow)
  green:      '#1a3d2b',
  greenLight: '#52b788',
  greenDeep:  '#0f2419',
  /** @deprecated Use `greenLight` for secondary; `greenDeep` for button depth */
  greenDark:  '#52b788',
  lime:       '#A4DE3A',
  // Brand accents
  coral:      '#FF6B5B',
  coralDeep:  '#E04A39',
  sun:        '#FFC93C',
  sky:        '#5BC0EB',
  skyDeep:    '#2A8FB8',
  plum:       '#A855F7',
  earth:      '#92633A',
  earthLight: '#D4B896',
  /** Map user location dot + heading beam */
  mapUser:    '#d4a853',
  // Text
  ink:        '#152130',
  ink2:       '#33455A',
  dim:        '#7388A0',
  // Surfaces
  bg:         '#FFF8E7',
  bg2:        '#FFFBF0',
  canvas:     '#FFF8E7',
  card:       '#FFFFFF',
  hairline:   '#E7EDF3',
  /** Toggle switch track — off (use with `greenLight` for on). See `ToggleSwitch`. */
  switchOff:  '#B5C2CE',
} as const

/** @deprecated Use `colors` */
export const color = {
  ...colors,
  hair: colors.hairline,
  black: '#000000',
} as const

const cardDropShadow = {
  shadowColor: '#152130',
  shadowOffset: { width: 0, height: 14 },
  shadowOpacity: 0.22,
  shadowRadius: 32,
  elevation: 14,
} as const

export const shadow = {
  /** Default for all content cards (species profile, dex grid, vitals, home, etc.). */
  card: cardDropShadow,
  /** @deprecated Use `shadow.card` — identical values. */
  dexCard: cardDropShadow,
  /** Creature of the day / featured hero cards. */
  featured: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 12,
  },
  pop: {
    shadowColor: '#152130',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
  /** Bottom sheets — casts upward so white cards read on light maps */
  sheetUp: {
    shadowColor: '#152130',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 12,
  },
} as const

/** Shadow wrapper for hero/profile cards — use on an outer View with borderRadius. */
export const profileCardShadow = {
  backgroundColor: 'transparent',
  ...cardDropShadow,
} as const

/**
 * Layout spacing — 4pt grid up to 24px; above 24 use multiples of 8 (32, 40, 48…).
 * Never use raw pixel literals for margin, padding, or gap.
 */
export const space = {
  4: 4,
  8: 8,
  16: 16,
  24: 24,
  32: 32,
  40: 40,
  48: 48,
  56: 56,
  64: 64,
  72: 72,
  80: 80,
} as const

export const radius = { sm:8, md:14, lg:18, xl:22, xxl:28, pill:999 } as const

export const type = {
  display: { family: 'BricolageGrotesque-ExtraBold', weight: '800' as const },
  body: { family: 'Nunito', weights: { regular:'400', medium:'500', bold:'700', extra:'800', black:'900' } },
  size: { displayXL:48, displayLG:36, displayMD:30, displaySM:22, title:18, bodyLG:17, body:15, bodySM:14, label:13, caption:12, micro:11 },
} as const
