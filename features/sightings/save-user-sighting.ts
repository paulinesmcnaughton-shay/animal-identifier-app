import * as FileSystem from 'expo-file-system/legacy'
import * as Location from 'expo-location'

import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { mapPrivacyFromSettings } from '@/features/map/map-privacy-from-settings'
import { STREAK_WINDOW_MS } from '@/features/profile/streak'
import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { loadSettingsPreferences } from '@/features/settings/preferences'
import { getSupabaseClient } from '@/lib/supabase/client'

const XP_NEW_SPECIES = 25
const XP_REPEAT_SPECIES = 5
const SIGHTINGS_DIR = `${FileSystem.documentDirectory}sightings/`

async function persistCapturePhoto(uri: string): Promise<string> {
  await FileSystem.makeDirectoryAsync(SIGHTINGS_DIR, { intermediates: true })
  const filename = `sighting-${Date.now()}.jpg`
  const dest = `${SIGHTINGS_DIR}${filename}`
  await FileSystem.copyAsync({ from: uri, to: dest })
  return dest
}

export interface SaveUserSightingInput {
  speciesId: string
  speciesName: string
  kingdom: KingdomKey
  latinName?: string | null
  dexNumber?: string | null
  confidence?: number | null
  isDomestic?: boolean
  photoUri?: string | null
}

export interface SaveUserSightingResult {
  ok: boolean
  isNewSpecies: boolean
  errorMessage?: string
}

function computeNextStreak(
  currentStreak: number,
  lastSpottedAt: string | null,
  nowMs: number,
): number {
  if (!lastSpottedAt) return 1

  const elapsed = nowMs - new Date(lastSpottedAt).getTime()
  if (elapsed <= STREAK_WINDOW_MS) return Math.max(currentStreak, 1)
  if (elapsed <= STREAK_WINDOW_MS * 2) return currentStreak + 1
  return 1
}

export async function saveUserSighting(
  input: SaveUserSightingInput,
): Promise<SaveUserSightingResult> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, isNewSpecies: false, errorMessage: 'Sign in to save sightings.' }
  }

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) {
    return { ok: false, isNewSpecies: false, errorMessage: 'Sign in to save sightings.' }
  }

  const speciesId = input.speciesId.trim() || slugifySpeciesName(input.speciesName)
  const prefs = await loadSettingsPreferences()

  const { data: existingSpecies } = await supabase
    .from('user_sightings')
    .select('id')
    .eq('user_id', userId)
    .eq('species_id', speciesId)
    .limit(1)

  const isNewSpecies = (existingSpecies ?? []).length === 0

  let latitude: number | null = null
  let longitude: number | null = null

  if (prefs.autoTagLocation) {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status === 'granted') {
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      }
    } catch {
      // Location optional — sighting still saves
    }
  }

  const spottedAt = new Date().toISOString()

  let savedPhotoUri = input.photoUri?.trim() || null
  if (savedPhotoUri) {
    try {
      savedPhotoUri = await persistCapturePhoto(savedPhotoUri)
    } catch {
      // keep original URI if copy fails
    }
  }

  const { error: insertError } = await supabase.from('user_sightings').insert({
    user_id: userId,
    species_id: speciesId,
    species_name: input.speciesName.trim(),
    kingdom: input.kingdom,
    latin_name: input.latinName?.trim() || null,
    dex_number: input.dexNumber?.trim() || null,
    confidence: input.confidence ?? null,
    is_domestic: input.isDomestic ?? false,
    photo_uri: savedPhotoUri,
    latitude,
    longitude,
    spotted_at: spottedAt,
  })

  if (insertError) {
    if (__DEV__) console.warn('[WildKind] user_sightings insert failed:', insertError.message)
    return { ok: false, isNewSpecies: false, errorMessage: insertError.message }
  }

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'xp, streak_days, last_spotted_at, spots_captured, weekly_quest_current, weekly_quest_total',
    )
    .eq('id', userId)
    .maybeSingle()

  const { data: allSpeciesRows } = await supabase
    .from('user_sightings')
    .select('species_id')
    .eq('user_id', userId)

  const distinctSpecies = new Set((allSpeciesRows ?? []).map((row) => row.species_id)).size
  const nowMs = Date.now()
  const nextStreak = computeNextStreak(
    profileRow?.streak_days ?? 0,
    profileRow?.last_spotted_at ?? null,
    nowMs,
  )
  const xpGain = isNewSpecies ? XP_NEW_SPECIES : XP_REPEAT_SPECIES
  const nextXp = (profileRow?.xp ?? 0) + xpGain
  const questCurrent = profileRow?.weekly_quest_current ?? 0
  const questTotal = profileRow?.weekly_quest_total ?? 3

  await supabase
    .from('profiles')
    .update({
      spots_captured: distinctSpecies,
      last_spotted_at: spottedAt,
      streak_days: nextStreak,
      xp: nextXp,
      weekly_quest_current: Math.min(questCurrent + 1, questTotal),
    })
    .eq('id', userId)

  const privacy = mapPrivacyFromSettings(prefs.sightingsVisibility)
  if (privacy !== 'private' && latitude != null && longitude != null) {
    await supabase.from('community_sightings').insert({
      species_name: input.speciesName.trim(),
      species_id: speciesId,
      kingdom: input.kingdom,
      latitude,
      longitude,
      privacy,
      user_id: userId,
      report_count: 1,
      spotted_at: spottedAt,
    })
  }

  notifyAccountProfileChanged()

  return { ok: true, isNewSpecies }
}
