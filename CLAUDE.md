# Wildr — Project Rules

Wildr is a playful, Pokédex-style animal and insect identifier for iOS. The tone is naturalist meets gamified field guide — think Duolingo crossed with iNaturalist. Every design and engineering decision should feel like it belongs in that world: warm, rewarding, a little wild.

This file is the single source of truth for how Claude behaves on this project. It extends the global rules with everything specific to Wildr.

---

## WHAT WE ARE BUILDING

A React Native iOS app where users photograph animals, insects, and other wildlife. An AI model identifies the species. The result is logged to a personal Wild Dex — a Pokédex-style collection that tracks sightings, awards XP, and unlocks badges. The app has a strong gamification layer and a naturalist identity system built around 8 taxonomic kingdoms.

**17 screens. 22 components. 40 color tokens. 8 kingdoms.**

---

## TECH STACK

| Layer | Choice |
|---|---|
| Framework | Expo SDK 51 — managed workflow |
| React Native | 0.74 |
| Language | TypeScript strict |
| Routing | expo-router (filesystem-based) |
| Styling | NativeWind v4 or StyleSheet — all values from tokens.ts |
| Animation | react-native-reanimated (scan overlay, scroll-driven hero) |
| Camera | expo-camera (viewfinder), expo-image-picker (library) |
| Maps | react-native-maps (Apple Maps on iOS), react-native-map-clustering |
| Storage | expo-sqlite + FTS5 (species DB), MMKV (prefs, dex state), expo-secure-store (identity) |
| Audio | expo-av (species sounds), expo-recording (user calls) |
| Icons | react-native-svg — all 42 icons rendered as SVG components, no icon font |
| ML | Hosted inference (iNat-style server, ~300ms) + on-device MobileNetV3 fallback |
| Blur | expo-blur (GlassPill backdrops) |

---

## PROJECT FILE STRUCTURE

```
wildr/
├─ app/                        # expo-router screens
│  ├─ (tabs)/
│  │  ├─ _layout.tsx           # tab bar with center FAB
│  │  ├─ home.tsx              # Spot screen
│  │  ├─ dex.tsx               # Wild Dex
│  │  ├─ map.tsx               # Sightings map
│  │  └─ me.tsx                # Profile
│  ├─ capture/
│  │  ├─ scan.tsx              # Camera viewfinder
│  │  ├─ upload.tsx            # Library picker
│  │  ├─ scanning.tsx          # AI scan animation
│  │  └─ result.tsx            # Identification result
│  ├─ species/[id].tsx         # Species detail
│  └─ onboarding/
│     ├─ welcome.tsx
│     ├─ snap.tsx
│     └─ collect.tsx
├─ src/
│  ├─ design/
│  │  ├─ tokens.ts             # All design tokens — see below
│  │  ├─ kingdom.ts            # Kingdom palette + helpers
│  │  └─ shadows.ts            # Cross-platform shadow helpers
│  ├─ components/
│  │  ├─ Button.tsx            # Chunky bottom-shadow CTA (Duolingo motif)
│  │  ├─ KingdomBadge.tsx
│  │  ├─ GlassPill.tsx
│  │  ├─ ProgressBar.tsx
│  │  ├─ StatBar.tsx
│  │  ├─ DexCard.tsx
│  │  ├─ SpeciesArt.tsx        # Photo + gradient fallback
│  │  ├─ ConfidenceMeter.tsx
│  │  ├─ MapPin.tsx
│  │  ├─ BadgeMedal.tsx
│  │  ├─ BottomNav.tsx
│  │  ├─ ListRow.tsx
│  │  ├─ ScanOverlay/
│  │  │  ├─ Radar.tsx          # Sweep + data labels
│  │  │  ├─ Particles.tsx      # Converging shimmer
│  │  │  └─ Stepwise.tsx       # Kingdom → species drilldown
│  │  └─ Icon.tsx              # All 42 SVG icons
│  ├─ data/
│  │  ├─ species.db            # Bundled SQLite FTS5 (~47k species, ~80MB)
│  │  ├─ species.ts            # Species type + queries
│  │  └─ taxonomy.ts
│  ├─ features/
│  │  ├─ capture/
│  │  ├─ dex/
│  │  ├─ map/
│  │  ├─ profile/
│  │  └─ identify/             # Model call + alternatives
│  └─ lib/
│     ├─ storage.ts            # MMKV wrapper
│     ├─ xp.ts                 # XP rules + level curve
│     └─ permissions.ts        # Camera, location, photos
├─ assets/
│  ├─ fonts/                   # Nunito + Bricolage Grotesque
│  └─ images/
└─ app.json
```

---

## DESIGN TOKENS

All values live in `src/design/tokens.ts`. Never hardcode any of these values anywhere else.

### Colors

```typescript
export const colors = {
  // Brand primary
  green:      '#15B981',
  greenDark:  '#0E8F65',
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
  // Text
  ink:        '#152130',
  ink2:       '#33455A',
  dim:        '#7388A0',
  // Surfaces
  bg:         '#FFF8E7',
  bg2:        '#FFFBF0',
  card:       '#FFFFFF',
  hairline:   '#E7EDF3',
} as const
```

### Kingdom palette

Every species belongs to one of 8 kingdoms. Badges, photo frames, dex chips, and map pins all derive their color from this system. Never invent a kingdom color — always reference `kingdom[key]`.

```typescript
export const kingdom = {
  mammal:    { color: '#92633A', tint: '#F5EBDC', accent: '#C28A52' },
  bird:      { color: '#2A8FB8', tint: '#DEF1F8', accent: '#5BC0EB' },
  reptile:   { color: '#0E8F65', tint: '#D8F4E8', accent: '#15B981' },
  amphibian: { color: '#65A30D', tint: '#ECF7D6', accent: '#A4DE3A' },
  fish:      { color: '#0369A1', tint: '#DBEEF8', accent: '#38BDF8' },
  insect:    { color: '#7C3AED', tint: '#EDE0FB', accent: '#A855F7' },
  arachnid:  { color: '#4338CA', tint: '#E0E1F8', accent: '#6366F1' },
  mollusc:   { color: '#B45309', tint: '#FCE7C7', accent: '#F59E0B' },
} as const
export type KingdomKey = keyof typeof kingdom
```

### Spacing

4pt grid. Use only these values.

```typescript
export const space = {
  2:2, 4:4, 6:6, 8:8, 10:10, 12:12, 14:14, 16:16,
  20:20, 24:24, 28:28, 32:32, 40:40, 56:56
} as const
```

### Border radius

```typescript
export const radius = {
  sm: 8,    // buttons, chips
  md: 14,   // inputs
  lg: 18,   // cards
  xl: 22,   // hero cards
  xxl: 28,  // sheet handles
  pill: 999
} as const
```

### Typography

```typescript
export const type = {
  display: {
    family: 'BricolageGrotesque-ExtraBold',
    weight: '800' as const,
  },
  body: {
    family: 'Nunito',
    weights: { regular: '400', medium: '500', bold: '700', extra: '800', black: '900' },
  },
  size: {
    displayXL: 48,   // hero (Onboarding 1)
    displayLG: 36,   // screen title
    displayMD: 30,   // species name (hero)
    displaySM: 22,   // section header
    title: 18,       // card titles
    bodyLG: 17,      // onboarding paragraph
    body: 15,        // default paragraph
    bodySM: 14,      // list item body
    label: 13,       // button / nav label
    caption: 12,     // metadata, dates
    micro: 11,       // UPPERCASE chip label, letterSpacing 0.5
  },
} as const
```

### Shadows

```typescript
export const shadow = {
  card: {
    shadowColor: '#152130',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  pop: {
    shadowColor: '#152130',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const
```

---

## DESIGN RULES

### Typography rules

- **Bricolage Grotesque** is display only: screen titles, hero numbers, big moments. Always 800 weight, letter-spacing -0.02em.
- **Nunito** is everything else: body text, labels, buttons, nav. Weights: 500 body, 700-800 emphasis, 900 uppercase labels.
- Never set a font size or weight directly. Always reference `type.size` and `type.body.weights`.
- `micro` (11px) is always UPPERCASE with `letterSpacing: 0.5`.

### Color rules

- Brand green (`#15B981`) is the primary action color. All primary CTAs, active states, and success feedback.
- Kingdom colors are identity only — never use them as generic accent colors outside of species-related UI.
- `ink` (#152130) for primary text, `ink2` (#33455A) for secondary, `dim` (#7388A0) for tertiary and metadata.
- `bg` (#FFF8E7) is the warm cream background — the emotional warmth of the brand lives here. Never use pure white as a background.
- `hairline` (#E7EDF3) for dividers, borders, and subtle separators.

### Button rules

The Duolingo bottom-shadow motif is mandatory for all primary CTAs. This is the brand's most distinctive visual element.

- Wrap every primary button in a `View` with `backgroundColor: darker shade`, `paddingBottom: 4`, `borderRadius: radius.sm`.
- The `Pressable` inside translates `translateY: 2` on press to simulate pressing down.
- Never use a standard RN shadow for primary buttons — always use the flat bottom-shadow layer.
- Ghost buttons: white background, no bottom shadow, green border.

### Icon rules

- All 42 icons are SVG components rendered via react-native-svg. No icon font.
- Size scale: 14 (inline chip), 16 (list row), 20 (button), 24 (nav tab), 28 (CTA shutter).
- Color is always `currentColor` — icons inherit from parent text color.
- Stroke weight: 2px default, 2.5-3px for emphasis.

### Navigation

Bottom tab bar with 4 tabs + a center FAB:
- **Spot** (home) — `WIcon name="home"`
- **Dex** — `WIcon name="dex"`
- [Center FAB] — Camera shutter, opens `/capture/scan`
- **Map** — `WIcon name="map"`
- **Me** — `WIcon name="profile"`

The FAB is not a tab. It sits above the tab bar as an absolute-positioned element. `router.push('/capture/scan')` on press.

Active tab color: `colors.green`. Inactive: `colors.dim`.

### GlassPill

Used for overlays on camera screens and dark hero images. Uses `expo-blur` with `BlurView` at `intensity: 60`. Background: `rgba(255,255,255,0.12)`. Border: 1px `rgba(255,255,255,0.2)`. Border radius: `radius.pill`.

---

## SCREENS

### 01 Onboarding (3 screens)
Welcome, Snap, Collect. Full-screen with large display typography, SpeciesArt clusters, and a bottom CTA button. No skip button on Welcome. Skip available from Snap onward.

### 02 Spot — home
Post-onboarding landing. Daily greeting, streak indicator, nearby species cards, quick-capture FAB prominent. Shows XP and level progress at top.

### 03 Capture flow
Camera → Upload → AI Scan → Result. Camera and scanning screens are dark (`bg: '#0F172A'`). Result screen returns to light theme.

**AI scan animation has 3 styles — always respect the user's selected style:**
- `radar` — rotating sweep with data labels appearing around the subject
- `particles` — converging shimmer of particles toward the center
- `stepwise` — taxonomic drilldown: Kingdom → Class → Order → Species, revealed step by step

**Confidence thresholds:**
- ≥ 70%: show top result with confidence meter
- 50-69%: show top result + alternatives list, prompt confirmation
- < 50%: show alternatives only, ask user to confirm or retake

### 04 Species detail (3 directions)
Three design directions exist in the prototype. Pick one or let the user toggle:
- **Pokédex card** — light, structured, stats-forward with the dex number prominent
- **Editorial guide** — content-rich, magazine layout, conservation info prominent
- **Hero scroll** — dark, full-bleed photo, parallax on scroll

In production, use the Pokédex card direction as default. The others can be future A/B tests.

### 05 Collection & discovery
- **Wild Dex** — grid of species cards, sorted by dex ID. Unidentified slots show locked silhouettes.
- **Discover** — search with FTS5, filters by kingdom
- **Sightings map** — Apple Maps with clustered pins colored by kingdom
- **Nearby** — proximity list, uses location

### 06 Profile, badges, settings
- **Profile** — username, level, XP bar, stats (total species, kingdoms, streak)
- **Achievements** — badge grid, locked badges shown as gray silhouettes
- **Settings** — notification prefs, units (metric/imperial), account

---

## SPECIES DATA MODEL

```typescript
interface Species {
  id: string
  common: string          // 'Red Fox'
  latin: string           // 'Vulpes vulpes'
  kingdom: KingdomKey
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare'
  dexId: string           // '#012'
  confidence: number      // 0-1, from ML model
  region: string
  sounds: boolean
  conservation: string    // IUCN status
}
```

Species IDs in the sample database: fox, monarch, cardinal, frog, beetle, gecko, spider, bumblebee, koi, owl, turtle, snail. Use these for mock data.

---

## XP AND GAMIFICATION RULES

All XP logic lives in `src/lib/xp.ts`. Never compute XP inline in a component.

| Trigger | Reward |
|---|---|
| Identify any species (first time) | +25 XP |
| Identify a rare species (first time) | +50 XP |
| Identify a species already seen | +5 XP |
| First species in a new kingdom | +100 XP + badge |
| Daily streak day N | +10 XP × min(N, 10) |
| Spot in a new biome | +15 XP |
| 7-day streak milestone | +200 XP + badge |
| Identify after sunset | +5 XP (Night Owl bonus) |

**Level curve:** `XP_for_level(n) = 100 × n × 1.15^n`
- Level 1: 115 XP
- Level 14: ~3,000 XP

Keep the level curve tunable from remote config — never hardcode it in a component.

---

## ML AND IDENTIFICATION

- Primary: hosted inference (iNaturalist Computer Vision API or equivalent), target ~300ms
- Fallback: on-device quantized MobileNetV3, top 5,000 species, under 50MB
- Never block the UI during inference — always show the scan animation
- Mock the model response for development: hardcode a Bombus terrestris (bumblebee) response so the full capture → result flow works before ML is wired up
- Model response shape: `{ topResult: Species, confidence: number, alternatives: Species[] }`

---

## ASSET REQUIREMENTS

### Photography
- Species hero photos: 4:3 ratio, minimum 1600px wide, CC-BY-SA licensed (iNaturalist)
- Onboarding illustrations: 3 scenes replacing the SpeciesArt cluster placeholders
- Empty states: locked dex card art, empty search, no nearby species

### Audio
- Species calls: birds (xeno-canto), frogs and mammals (Macaulay Library)
- UI sounds: shutter click, identification reveal, XP gained, badge unlock, streak increment

### Fonts (bundle these weights only)
- Bricolage Grotesque: ExtraBold (800) only
- Nunito: Medium (500), Bold (700), ExtraBold (800), Black (900)

---

## iOS PERMISSIONS

Add to `app.json` → `ios.infoPlist`:

```json
{
  "NSCameraUsageDescription": "Wildr uses your camera to identify animals and insects in the wild.",
  "NSPhotoLibraryUsageDescription": "Allow Wildr to identify creatures from photos in your library.",
  "NSLocationWhenInUseUsageDescription": "Wildr tags your sightings with where you saw them and shows nearby species.",
  "NSMicrophoneUsageDescription": "Wildr records nearby animal calls to help identification.",
  "NSPhotoLibraryAddUsageDescription": "Save Wildr photos to your library."
}
```

---

## COMPONENT RULES

### Naming
Component files use PascalCase and match the design system exactly: `Button.tsx`, `KingdomBadge.tsx`, `DexCard.tsx`, `ScanOverlay/Radar.tsx`.

### Build order
Build atoms before patterns, patterns before screens. Do not build a screen before all its component dependencies exist.

Atoms first: Button, GlassPill, KingdomBadge, ProgressBar, StatBar, Icon.
Then patterns: DexCard, SpeciesArt, ConfidenceMeter, MapPin, BadgeMedal, BottomNav, ListRow.
Then ScanOverlay variants: Radar, Particles, Stepwise.
Then screens.

### SpeciesArt
Photo placeholder with a radial gradient background derived from the species artwork palette. Falls back to the SVG silhouette art when no photo is available. Never show a broken image or empty box.

### KingdomBadge
Always colored using `kingdom[species.kingdom]`. The badge is the visual anchor of the species identity — get the color right.

### DexCard
Shows dex number, species name in display font, kingdom badge, rarity indicator, and a locked silhouette when the species has not been identified. The locked state is important — it creates the collection motivation.

---

## TONE AND COPY RULES

- App name: **Wildr** — no period, no tagline needed inline
- Tab labels: Spot, Dex, Map, Me (short, single word)
- Screen titles use Bricolage Grotesque, title case
- Body copy is warm and encouraging — never clinical or taxonomically dry
- XP notifications: short and celebratory ("New species! +25 XP", "Kingdom unlocked!")
- Empty states: inviting, not apologetic ("Nothing spotted yet — head outside!")
- Error states: friendly and actionable ("Couldn't identify that one. Try a clearer angle.")
- Never use "Pokédex", "Pokedex", or any Pokemon-related terminology anywhere in the app or codebase.

---

## DEVELOPMENT RULES

- Always use TypeScript. Never use `.js` or `.jsx` files.
- All colors, spacing, radius, and type values must come from `src/design/tokens.ts`. Never hardcode any design value.
- Follow expo-router file-based routing conventions. Screen files live in `app/`, not `src/screens/`.
- Run the simulator with: `REACT_NATIVE_PACKAGER_HOSTNAME=127.0.0.1 npx expo run:ios`
- Auth state (isLoggedIn) is stored via AsyncStorage in `src/util/storage.ts`. Never manage auth state inline in a component.
- Never use "Pokédex", "Pokedex", or any Pokémon-related terminology anywhere in the app, codebase, or copy.

---

## DEVELOPMENT SEQUENCE

Follow this order to build end-to-end as quickly as possible:

1. Spin up Expo project with expo-router tab structure
2. Drop in `tokens.ts` and load fonts with expo-font — verify display fonts render
3. Build the 6 atoms: Button, GlassPill, KingdomBadge, ProgressBar, StatBar, Icon
4. Stub the ML model with a hardcoded Bombus terrestris response
5. Build capture flow end-to-end: Camera → mock scan → mock result → species detail
6. Build Wild Dex with mock species data
7. Build Spot home screen
8. Plug in real ML inference
9. Add XP system and gamification
10. Add map and nearby screens
11. Add profile, achievements, settings

---

*This file is the Wildr project source of truth. Update it when new patterns are established, screens change, or token values are updated.*
