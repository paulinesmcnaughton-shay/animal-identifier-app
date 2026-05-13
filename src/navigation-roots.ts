/**
 * Expo Router maps `src/app/` to URLs. Shared navigation metadata lives here
 * (not under `app/`) so it is not treated as a route.
 *
 * - Root stack: `src/app/_layout.tsx` (Stack)
 * - Bottom tabs: `src/app/(tabs)/_layout.tsx` (Tabs + custom tab bar)
 * - Modals / stacks: `modal.tsx`, `capture/*`, `dex/*`, `species/*`, etc.
 *
 * Use `navigationRoots` for deep links, analytics, etc. Route UI stays in `src/screens/`.
 */

export const navigationRoots = {
  tabsGroup: '(tabs)',
  onboardingGroup: '(onboarding)',
} as const
