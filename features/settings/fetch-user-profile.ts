import type { User } from '@supabase/supabase-js'

import { mockUser, mockWeeklyQuest } from '@/data/mock'
import type { AccountProfile } from '@/features/settings/account-profile'
import {
  buildWeeklyQuestProgress,
  NEW_USER_BADGES_COUNT,
  NEW_USER_LEVEL,
  NEW_USER_RARE_SPOTTED,
  NEW_USER_SPOTS_CAPTURED,
  NEW_USER_STREAK_DAYS,
  NEW_USER_XP,
  newUserWeeklyQuest,
  type WeeklyQuestProgress,
} from '@/features/profile/home-stats'
import { resolveEffectiveStreakDays } from '@/features/profile/streak'
import { TESTER_AVATAR_PRESET_ID } from '@/features/settings/avatar-presets'
import { assignNewUserAvatar, loadProfilePhotoUri } from '@/features/settings/profile-avatar'
import {
  firstNameFromDisplayName,
  saveDisplayName,
  saveEmail,
  savePhone,
  saveUsername,
} from '@/features/settings/preferences'
import { normalizeUsername } from '@/features/settings/username'
import { isDemoSessionActive } from '@/lib/auth/demo-session'
import { getSupabaseClient } from '@/lib/supabase/client'
import { isTesterEmail } from '@/features/settings/tester-account'
import { storage } from '@/util/storage'

const AVATAR_PRESET_ID_KEY = 'settings.avatarPresetId'

const PROFILE_SELECT =
  'username, full_name, timezone, latitude, longitude, level, xp, streak_days, last_spotted_at, spots_captured, rare_spotted, badges_count, weekly_quest_title, weekly_quest_current, weekly_quest_total, weekly_quest_xp_reward, weekly_quest_started_at, avatar_url'

export interface HomeUserProfile extends AccountProfile {
  timeZone: string | null
  xp: number
  spotsCaptured: number
  rareSpotted: number
  badgesCount: number
  streakDays: number
  weeklyQuest: WeeklyQuestProgress
}

interface SupabaseProfileRow {
  username: string | null
  full_name: string | null
  timezone: string | null
  latitude: number | null
  longitude: number | null
  level: number | null
  xp: number | null
  streak_days: number | null
  last_spotted_at: string | null
  spots_captured: number | null
  rare_spotted: number | null
  badges_count: number | null
  weekly_quest_title: string | null
  weekly_quest_current: number | null
  weekly_quest_total: number | null
  weekly_quest_xp_reward: number | null
  weekly_quest_started_at: string | null
  avatar_url: string | null
}

function readMetadataString(user: User, key: string): string | null {
  const value = user.user_metadata?.[key]
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function defaultUsernameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'explorer'
  const handle = local.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
  return handle.length >= 3 ? handle : 'wildr_explorer'
}

function formatUsernameAsName(username: string): string {
  const trimmed = username.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function resolveDisplayName(user: User, profileUsername: string | null): string {
  const fromMetadata =
    readMetadataString(user, 'display_name')
    ?? readMetadataString(user, 'full_name')
    ?? readMetadataString(user, 'name')

  if (fromMetadata) return fromMetadata

  if (profileUsername?.trim()) {
    return formatUsernameAsName(profileUsername.trim())
  }

  const emailLocal = user.email?.split('@')[0]?.trim()
  if (emailLocal) return formatUsernameAsName(emailLocal)

  return 'Explorer'
}

function weeklyQuestFromRow(row: SupabaseProfileRow | null): WeeklyQuestProgress {
  if (!row) return newUserWeeklyQuest()

  return buildWeeklyQuestProgress({
    title: row.weekly_quest_title?.trim() || newUserWeeklyQuest().title,
    current: row.weekly_quest_current ?? 0,
    total: row.weekly_quest_total ?? newUserWeeklyQuest().total,
    xpReward: row.weekly_quest_xp_reward ?? newUserWeeklyQuest().xpReward,
    weekStartedAt: row.weekly_quest_started_at,
  })
}

async function maybePersistExpiredStreak(userId: string, row: SupabaseProfileRow): Promise<void> {
  const storedStreak = row.streak_days ?? 0
  const effective = resolveEffectiveStreakDays(storedStreak, row.last_spotted_at)
  if (storedStreak <= 0 || effective > 0) return

  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('profiles').update({ streak_days: 0 }).eq('id', userId)
  if (error && __DEV__) console.warn('[WildKind] streak reset failed:', error.message)
}

function statsFromRow(row: SupabaseProfileRow | null): Pick<
  HomeUserProfile,
  'level' | 'xp' | 'spotsCaptured' | 'rareSpotted' | 'badgesCount' | 'streakDays' | 'weeklyQuest'
> {
  if (!row) {
    return {
      level: NEW_USER_LEVEL,
      xp: NEW_USER_XP,
      spotsCaptured: NEW_USER_SPOTS_CAPTURED,
      rareSpotted: NEW_USER_RARE_SPOTTED,
      badgesCount: NEW_USER_BADGES_COUNT,
      streakDays: NEW_USER_STREAK_DAYS,
      weeklyQuest: newUserWeeklyQuest(),
    }
  }

  const storedStreak = row.streak_days ?? NEW_USER_STREAK_DAYS

  return {
    level: row.level ?? NEW_USER_LEVEL,
    xp: row.xp ?? NEW_USER_XP,
    spotsCaptured: row.spots_captured ?? NEW_USER_SPOTS_CAPTURED,
    rareSpotted: row.rare_spotted ?? NEW_USER_RARE_SPOTTED,
    badgesCount: row.badges_count ?? NEW_USER_BADGES_COUNT,
    streakDays: resolveEffectiveStreakDays(storedStreak, row.last_spotted_at),
    weeklyQuest: weeklyQuestFromRow(row),
  }
}

async function ensureProfileRow(userId: string): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('profiles').upsert({ id: userId }, { onConflict: 'id', ignoreDuplicates: true })

  if (error && __DEV__) {
    console.warn('[WildKind] profiles ensure failed:', error.message)
  }
}

async function fetchSupabaseProfileRow(userId: string): Promise<SupabaseProfileRow | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const pendingOnboarding = (await storage.getString('onboarding.pending')) === 'true'
  if (!pendingOnboarding) await ensureProfileRow(userId)

  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    if (__DEV__) console.warn('[WildKind] profiles fetch failed:', error.message)
    return null
  }

  if (data) await maybePersistExpiredStreak(userId, data)

  return data
}

export async function buildUserProfileFromAuth(user: User): Promise<AccountProfile> {
  const home = await buildHomeUserProfileFromAuth(user)
  return {
    displayName: home.displayName,
    username: home.username,
    email: home.email,
    phone: home.phone,
    firstName: home.firstName,
    level: home.level,
  }
}

export async function buildHomeUserProfileFromAuth(user: User): Promise<HomeUserProfile> {
  const profileRow = await fetchSupabaseProfileRow(user.id)
  const rawProfileUsername = profileRow?.username?.trim() ?? null
  const profileUsername = rawProfileUsername ? normalizeUsername(rawProfileUsername) || null : null

  const metaUsername = readMetadataString(user, 'username')
  const sanitizedMetaUsername = metaUsername ? normalizeUsername(metaUsername) || null : null

  const username =
    profileUsername
    ?? sanitizedMetaUsername
    ?? (user.email ? defaultUsernameFromEmail(user.email) : 'wildr_explorer')

  const fullNameFromDB = profileRow?.full_name?.trim() || null
  const displayName = fullNameFromDB ?? resolveDisplayName(user, profileUsername)
  const stats = statsFromRow(profileRow)

  return {
    displayName,
    username,
    email: user.email?.trim().toLowerCase() ?? '',
    phone: readMetadataString(user, 'phone') ?? '',
    firstName: firstNameFromDisplayName(displayName),
    timeZone: profileRow?.timezone?.trim() ?? null,
    ...stats,
  }
}

export async function persistUserProfileLocally(profile: AccountProfile): Promise<void> {
  await saveDisplayName(profile.displayName)
  await saveUsername(profile.username)
  if (profile.email) await saveEmail(profile.email)
  if (profile.phone) await savePhone(profile.phone)
}

export function demoHomeUserProfile(
  displayName: string,
  username: string,
  email: string,
  phone: string,
): HomeUserProfile {
  return {
    displayName,
    username,
    email,
    phone,
    firstName: firstNameFromDisplayName(displayName),
    timeZone: null,
    level: mockUser.level,
    xp: 2340,
    spotsCaptured: mockUser.spotsCaptured,
    rareSpotted: 8,
    badgesCount: 23,
    streakDays: mockUser.streakDays,
    weeklyQuest: buildWeeklyQuestProgress({
      title: mockWeeklyQuest.title,
      current: mockWeeklyQuest.current,
      total: mockWeeklyQuest.total,
      xpReward: mockWeeklyQuest.xpReward,
      weekStartedAt: new Date().toISOString(),
    }),
  }
}

async function ensureRealUserAvatar(user: User): Promise<void> {
  if (isTesterEmail(user.email)) return

  // Restore cloud profile photo on new device / reinstall
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .maybeSingle()

    if (data?.avatar_url) {
      await storage.set('settings.profilePhotoPath', data.avatar_url)
      await storage.set('settings.avatarKind', 'photo')
      await storage.set('settings.avatarInitialized', 'true')
      return
    }
  }

  const existingPhoto = await loadProfilePhotoUri()
  if (existingPhoto) return

  const presetId = await storage.getString(AVATAR_PRESET_ID_KEY)
  if (!presetId || presetId === TESTER_AVATAR_PRESET_ID) {
    await assignNewUserAvatar()
  }
}

/** Supabase + auth metadata — never Alex Riley defaults. */
export async function fetchAuthenticatedHomeProfile(user: User): Promise<HomeUserProfile> {
  const profile = await buildHomeUserProfileFromAuth(user)
  await persistUserProfileLocally(profile)
  return profile
}

export async function setupAvatarForAuthenticatedUser(user: User): Promise<void> {
  try {
    await ensureRealUserAvatar(user)
  } catch (error) {
    if (__DEV__) console.warn('[WildKind] avatar setup skipped:', error)
  }
}

export async function shouldUseDemoProfile(user: User | null): Promise<boolean> {
  if (!user) return false
  if (await isDemoSessionActive()) return true
  return isTesterEmail(user.email)
}
