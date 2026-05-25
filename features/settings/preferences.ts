import { normalizeUsername } from '@/features/settings/username'
import { storage } from '@/util/storage'

export type CameraQuality = 'high' | 'medium' | 'low'
export type AppearanceMode = 'light' | 'dark' | 'system'
export type DexLayoutMode = 'grid-2' | 'grid-3' | 'list'
export type SightingsVisibility = 'public' | 'friends' | 'private'
export type StreakReminderTime = '07:00' | '12:00' | '19:00' | '20:00'

const KEYS = {
  displayName: 'settings.displayName',
  username: 'settings.username',
  email: 'settings.email',
  phone: 'settings.phone',
  cameraQuality: 'settings.cameraQuality',
  appearance: 'settings.appearance',
  dexLayout: 'settings.dexLayout',
  sightingsVisibility: 'settings.sightingsVisibility',
  autoRecordSounds: 'settings.autoRecordSounds',
  autoTagLocation: 'settings.autoTagLocation',
  vibrateOnIdentify: 'settings.vibrateOnIdentify',
  useScientificNames: 'settings.useScientificNames',
  streakReminder: 'settings.notifications.streakReminder',
  streakReminderTime: 'settings.notifications.streakReminderTime',
  notifyNewSpecies: 'settings.notifications.newSpecies',
  notifyBadgeUnlocked: 'settings.notifications.badgeUnlocked',
  notifyWeeklyQuest: 'settings.notifications.weeklyQuest',
} as const

export const SETTINGS_DEFAULTS = {
  displayName: 'Alex Riley',
  username: 'alexinthewild',
  email: 'alex.riley@email.com',
  phone: '+1 (555) 123-4567',
  cameraQuality: 'high' as CameraQuality,
  appearance: 'light' as AppearanceMode,
  dexLayout: 'grid-3' as DexLayoutMode,
  sightingsVisibility: 'public' as SightingsVisibility,
  autoRecordSounds: true,
  autoTagLocation: true,
  vibrateOnIdentify: false,
  useScientificNames: false,
  streakReminder: true,
  streakReminderTime: '19:00' as StreakReminderTime,
  notifyNewSpecies: true,
  notifyBadgeUnlocked: true,
  notifyWeeklyQuest: true,
} as const

export const STREAK_REMINDER_TIME_OPTIONS: {
  value: StreakReminderTime
  label: string
  subtitle: string
}[] = [
  { value: '07:00', label: '7:00 AM', subtitle: 'Morning nudge' },
  { value: '12:00', label: '12:00 PM', subtitle: 'Midday check-in' },
  { value: '19:00', label: '7:00 PM', subtitle: 'Default · after work' },
  { value: '20:00', label: '8:00 PM', subtitle: 'Evening reminder' },
]

export const CAMERA_QUALITY_OPTIONS: { value: CameraQuality; label: string; subtitle: string }[] = [
  { value: 'high', label: 'High', subtitle: '12 MP · best for IDs' },
  { value: 'medium', label: 'Medium', subtitle: '8 MP · balanced' },
  { value: 'low', label: 'Low', subtitle: '4 MP · saves storage' },
]

export const APPEARANCE_OPTIONS: { value: AppearanceMode; label: string; subtitle: string }[] = [
  { value: 'light', label: 'Light', subtitle: 'Warm cream field guide' },
  { value: 'dark', label: 'Dark', subtitle: 'Night spotting mode' },
  { value: 'system', label: 'System', subtitle: 'Match device settings' },
]

export const DEX_LAYOUT_OPTIONS: { value: DexLayoutMode; label: string; subtitle: string }[] = [
  { value: 'grid-2', label: 'Grid · 2 columns', subtitle: 'Larger cards' },
  { value: 'grid-3', label: 'Grid · 3 columns', subtitle: 'Default Wild Dex' },
  { value: 'list', label: 'List', subtitle: 'Compact rows' },
]

export const SIGHTINGS_VISIBILITY_OPTIONS: {
  value: SightingsVisibility
  label: string
  subtitle: string
}[] = [
  { value: 'public', label: 'Public', subtitle: 'Anyone can see your spots' },
  { value: 'friends', label: 'Friends only', subtitle: 'Followers you approve' },
  { value: 'private', label: 'Private', subtitle: 'Only you' },
]

const CAMERA_MP: Record<CameraQuality, string> = {
  high: '12 MP',
  medium: '8 MP',
  low: '4 MP',
}

function cameraQualityLabel(value: CameraQuality): string {
  return CAMERA_QUALITY_OPTIONS.find((o) => o.value === value)?.label ?? 'High'
}

function appearanceLabel(value: AppearanceMode): string {
  return APPEARANCE_OPTIONS.find((o) => o.value === value)?.label ?? 'Light'
}

function dexLayoutLabel(value: DexLayoutMode): string {
  return DEX_LAYOUT_OPTIONS.find((o) => o.value === value)?.label ?? 'Grid · 3 columns'
}

function sightingsVisibilityLabel(value: SightingsVisibility): string {
  return SIGHTINGS_VISIBILITY_OPTIONS.find((o) => o.value === value)?.label ?? 'Public'
}

export function formatAccountSubtitle(username: string): string {
  return `@${username}`
}

/** First token of display name — used for “Hey, Alex” on Spot home. */
export function firstNameFromDisplayName(displayName: string): string {
  const trimmed = displayName.trim()
  if (!trimmed) return ''
  return trimmed.split(/\s+/)[0] ?? trimmed
}

function streakReminderTimeLabel(value: StreakReminderTime): string {
  const label = STREAK_REMINDER_TIME_OPTIONS.find((o) => o.value === value)?.label ?? '7:00 PM'
  return label.toLowerCase().replace(/\s/g, '')
}

export function formatNotificationsSubtitle(
  streakReminder: boolean,
  streakReminderTime: StreakReminderTime,
): string {
  if (!streakReminder) return 'Streak reminder off'
  return `Daily streak reminder · ${streakReminderTimeLabel(streakReminderTime)}`
}

export interface SettingsPreferences {
  displayName: string
  username: string
  email: string
  phone: string
  cameraQuality: CameraQuality
  appearance: AppearanceMode
  dexLayout: DexLayoutMode
  sightingsVisibility: SightingsVisibility
  autoRecordSounds: boolean
  autoTagLocation: boolean
  vibrateOnIdentify: boolean
  useScientificNames: boolean
  streakReminder: boolean
  streakReminderTime: StreakReminderTime
  notifyNewSpecies: boolean
  notifyBadgeUnlocked: boolean
  notifyWeeklyQuest: boolean
}

export interface SettingsRowSubtitles {
  account: string
  notifications: string
  cameraQuality: string
  appearance: string
  dexLayout: string
  sightingsVisibility: string
}

async function readString(key: string, fallback: string): Promise<string> {
  const raw = await storage.getString(key)
  return raw ?? fallback
}

async function readBool(key: string, fallback: boolean): Promise<boolean> {
  const raw = await storage.getString(key)
  if (raw === null) return fallback
  return raw === 'true'
}

export async function loadSettingsPreferences(level = 14): Promise<SettingsPreferences> {
  return {
    displayName: await readString(KEYS.displayName, SETTINGS_DEFAULTS.displayName),
    username: await readString(KEYS.username, SETTINGS_DEFAULTS.username),
    email: await readString(KEYS.email, SETTINGS_DEFAULTS.email),
    phone: await readString(KEYS.phone, SETTINGS_DEFAULTS.phone),
    cameraQuality: (await readString(
      KEYS.cameraQuality,
      SETTINGS_DEFAULTS.cameraQuality,
    )) as CameraQuality,
    appearance: (await readString(KEYS.appearance, SETTINGS_DEFAULTS.appearance)) as AppearanceMode,
    dexLayout: (await readString(KEYS.dexLayout, SETTINGS_DEFAULTS.dexLayout)) as DexLayoutMode,
    sightingsVisibility: (await readString(
      KEYS.sightingsVisibility,
      SETTINGS_DEFAULTS.sightingsVisibility,
    )) as SightingsVisibility,
    autoRecordSounds: await readBool(KEYS.autoRecordSounds, SETTINGS_DEFAULTS.autoRecordSounds),
    autoTagLocation: await readBool(KEYS.autoTagLocation, SETTINGS_DEFAULTS.autoTagLocation),
    vibrateOnIdentify: await readBool(KEYS.vibrateOnIdentify, SETTINGS_DEFAULTS.vibrateOnIdentify),
    useScientificNames: await readBool(
      KEYS.useScientificNames,
      SETTINGS_DEFAULTS.useScientificNames,
    ),
    streakReminder: await readBool(KEYS.streakReminder, SETTINGS_DEFAULTS.streakReminder),
    streakReminderTime: (await readString(
      KEYS.streakReminderTime,
      SETTINGS_DEFAULTS.streakReminderTime,
    )) as StreakReminderTime,
    notifyNewSpecies: await readBool(KEYS.notifyNewSpecies, SETTINGS_DEFAULTS.notifyNewSpecies),
    notifyBadgeUnlocked: await readBool(
      KEYS.notifyBadgeUnlocked,
      SETTINGS_DEFAULTS.notifyBadgeUnlocked,
    ),
    notifyWeeklyQuest: await readBool(KEYS.notifyWeeklyQuest, SETTINGS_DEFAULTS.notifyWeeklyQuest),
  }
}

export function settingsRowSubtitles(
  prefs: SettingsPreferences,
  level = 14,
): SettingsRowSubtitles {
  return {
    account: formatAccountSubtitle(prefs.username),
    notifications: formatNotificationsSubtitle(prefs.streakReminder, prefs.streakReminderTime),
    cameraQuality: `${cameraQualityLabel(prefs.cameraQuality)} (${CAMERA_MP[prefs.cameraQuality]})`,
    appearance: appearanceLabel(prefs.appearance),
    dexLayout: dexLayoutLabel(prefs.dexLayout),
    sightingsVisibility: sightingsVisibilityLabel(prefs.sightingsVisibility),
  }
}

export async function saveDisplayName(displayName: string): Promise<void> {
  const normalized = displayName.trim().replace(/\s+/g, ' ')
  await storage.set(KEYS.displayName, normalized)
}

export async function saveUsername(username: string): Promise<void> {
  await storage.set(KEYS.username, normalizeUsername(username))
}

export async function saveEmail(email: string): Promise<void> {
  await storage.set(KEYS.email, email.trim())
}

export async function savePhone(phone: string): Promise<void> {
  await storage.set(KEYS.phone, phone.trim())
}

export async function saveCameraQuality(value: CameraQuality): Promise<void> {
  await storage.set(KEYS.cameraQuality, value)
}

export async function saveAppearance(value: AppearanceMode): Promise<void> {
  await storage.set(KEYS.appearance, value)
}

export async function saveDexLayout(value: DexLayoutMode): Promise<void> {
  await storage.set(KEYS.dexLayout, value)
}

export async function saveSightingsVisibility(value: SightingsVisibility): Promise<void> {
  await storage.set(KEYS.sightingsVisibility, value)
}

export async function saveAutoRecordSounds(value: boolean): Promise<void> {
  await storage.set(KEYS.autoRecordSounds, value ? 'true' : 'false')
}

export async function saveAutoTagLocation(value: boolean): Promise<void> {
  await storage.set(KEYS.autoTagLocation, value ? 'true' : 'false')
}

export async function saveVibrateOnIdentify(value: boolean): Promise<void> {
  await storage.set(KEYS.vibrateOnIdentify, value ? 'true' : 'false')
}

export async function saveUseScientificNames(value: boolean): Promise<void> {
  await storage.set(KEYS.useScientificNames, value ? 'true' : 'false')
}

export async function saveStreakReminder(value: boolean): Promise<void> {
  await storage.set(KEYS.streakReminder, value ? 'true' : 'false')
}

export async function saveStreakReminderTime(value: StreakReminderTime): Promise<void> {
  await storage.set(KEYS.streakReminderTime, value)
}

export async function saveNotifyNewSpecies(value: boolean): Promise<void> {
  await storage.set(KEYS.notifyNewSpecies, value ? 'true' : 'false')
}

export async function saveNotifyBadgeUnlocked(value: boolean): Promise<void> {
  await storage.set(KEYS.notifyBadgeUnlocked, value ? 'true' : 'false')
}

export async function saveNotifyWeeklyQuest(value: boolean): Promise<void> {
  await storage.set(KEYS.notifyWeeklyQuest, value ? 'true' : 'false')
}
