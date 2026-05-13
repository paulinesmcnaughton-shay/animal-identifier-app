/**
 * Expo Router owns navigation: file tree under `src/app/` maps to URLs.
 *
 * - Root stack: `src/app/_layout.tsx` (Stack)
 * - Bottom tabs: `src/app/(tabs)/_layout.tsx` (Tabs + custom tab bar)
 * - Modals / stacks: `modal.tsx`, `capture/*`, `dex/*`, `species/*`, etc.
 *
 * Use this module for cross-cutting navigation metadata (deep links, analytics)
 * when you add it — keep route components in `src/screens/`.
 */

export const navigationRoots = {
  tabsGroup: '(tabs)',
  onboardingGroup: '(onboarding)',
} as const
