import * as FileSystem from 'expo-file-system/legacy'
import * as Location from 'expo-location'

import { slugifySpeciesName } from '@/data/species-catalog'
import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import { STREAK_WINDOW_MS } from '@/features/profile/streak'
import type { Collection, CollectionLookup } from '@/features/collections/collections'
import { computeQuestRewardDelta, questCountsFromSightings, type SightingLike } from '@/features/quests/quests'
import {
  getCreatureOfWeek,
  getWeekMeta,
  kingdomsToExcludeFromInterests,
} from '@/features/home/creature-of-week'
import { addNotification } from '@/features/notifications/notifications'
import { levelForTotalXp } from '@/features/profile/xp-progress'
import { loadTimezone } from '@/features/settings/timezone-preference'
import { storeHabitatsForSighting } from '@/features/sightings/classify-habitat'
import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { loadSettingsPreferences } from '@/features/settings/preferences'
import { getSupabaseClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'

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

async function uploadPhotoToStorage(
  supabase: SupabaseClient<Database>,
  userId: string,
  uri: string,
): Promise<string | null> {
  console.log('UPLOAD PHOTO URI:', uri)

  const fileInfo = await FileSystem.getInfoAsync(uri)
  console.log('UPLOAD FILE INFO:', fileInfo)

  if (!fileInfo.exists) {
    console.warn('[WildKind] photo file does not exist:', uri)
    return null
  }

  if ('size' in fileInfo && fileInfo.size === 0) {
    console.warn('[WildKind] photo file is 0 bytes before upload — aborting')
    return null
  }

  try {
    const response = await fetch(uri)
    const arrayBuffer = await response.arrayBuffer()

    console.log('UPLOAD ARRAY BUFFER SIZE:', arrayBuffer.byteLength)

    if (arrayBuffer.byteLength === 0) {
      console.warn('[WildKind] arrayBuffer is 0 bytes — fetch did not read the file')
      return null
    }

    const filePath = `${userId}/${Date.now()}.jpg`
    console.log('SUPABASE STORAGE PATH:', filePath)

    const { data, error } = await supabase.storage
      .from('sighting-photos')
      .upload(filePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false })

    if (error) {
      console.warn('[WildKind] photo upload failed:', error.message)
      return null
    }

    console.log('SUPABASE UPLOAD DATA:', data)

    const { data: urlData } = supabase.storage
      .from('sighting-photos')
      .getPublicUrl(filePath)

    console.log('SUPABASE PUBLIC URL:', urlData.publicUrl)
    return urlData.publicUrl
  } catch (err) {
    console.warn('[WildKind] photo upload error:', err)
    return null
  }
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
  manualLatitude?: number | null
  manualLongitude?: number | null
  publishToMap?: boolean
  shareAnonymously?: boolean
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

  if (input.manualLatitude != null && input.manualLongitude != null) {
    latitude = input.manualLatitude
    longitude = input.manualLongitude
  } else if (prefs.autoTagLocation) {
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
    const remoteUrl = await uploadPhotoToStorage(supabase, userId, savedPhotoUri)
    if (remoteUrl) {
      savedPhotoUri = remoteUrl
    } else {
      try {
        savedPhotoUri = await persistCapturePhoto(savedPhotoUri)
      } catch {
        savedPhotoUri = null
      }
    }
  }

  const { data: insertedSighting, error: insertError } = await supabase
    .from('user_sightings')
    .insert({
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
    .select('id')
    .single()

  if (insertError) {
    if (__DEV__) console.warn('[WildKind] user_sightings insert failed:', insertError.message)
    return { ok: false, isNewSpecies: false, errorMessage: insertError.message }
  }

  console.log('INSERTED SIGHTING photo_uri:', savedPhotoUri)

  const { data: profileRow } = await supabase
    .from('profiles')
    .select(
      'xp, streak_days, last_spotted_at, spots_captured, badges_count, claimed_quests, age_group, requires_parent_setup, latitude, longitude, interests',
    )
    .eq('id', userId)
    .maybeSingle()

  const { data: allSpeciesRows } = await supabase
    .from('user_sightings')
    .select('species_id, kingdom, dex_number, is_domestic, species_name, latin_name')
    .eq('user_id', userId)

  // Quest counts are computed distinct-per-type internally, so pass all rows.
  // seenSpecies still gives the spots total.
  const seenSpecies = new Set<string>()
  const questSightings: SightingLike[] = (allSpeciesRows ?? []).map((row) => ({
    kingdom: row.kingdom,
    dexNumber: row.dex_number,
    speciesId: row.species_id,
    speciesName: row.species_name,
    scientificName: row.latin_name,
  }))
  for (const row of allSpeciesRows ?? []) {
    if (seenSpecies.has(row.species_id)) continue
    seenSpecies.add(row.species_id)
  }

  // Collection lookup so safari/zoo/aquarium/petting-zoo quests credit correctly.
  const { data: catalogRows } = await supabase
    .from('catalog_species')
    .select('common_name, scientific_name, collections')
  const collectionByName = new Map<string, Collection[]>()
  for (const c of catalogRows ?? []) {
    const cols = (c.collections ?? []) as Collection[]
    if (c.common_name) collectionByName.set(c.common_name.trim().toLowerCase(), cols)
    if (c.scientific_name) collectionByName.set(c.scientific_name.trim().toLowerCase(), cols)
  }
  const collectionLookup: CollectionLookup = (q) =>
    collectionByName.get((q.commonName ?? '').trim().toLowerCase()) ??
    collectionByName.get((q.scientificName ?? '').trim().toLowerCase()) ??
    []
  const distinctSpecies = seenSpecies.size
  const nowMs = Date.now()
  const nextStreak = computeNextStreak(
    profileRow?.streak_days ?? 0,
    profileRow?.last_spotted_at ?? null,
    nowMs,
  )
  const xpGain = isNewSpecies ? XP_NEW_SPECIES : XP_REPEAT_SPECIES

  // Quest rewards — credit each quest's badge (+XP) once when its goal is reached,
  // tied to the species the user has caught and the current streak.
  const questDelta = computeQuestRewardDelta(
    questCountsFromSightings(questSightings, { lookup: collectionLookup, streakDays: nextStreak }),
    profileRow?.claimed_quests ?? [],
  )
  // Creature of the Week bonus — if this capture IS the featured creature, award its
  // bonus once (gated by the same cotw:<year>-W<week> key the home claim uses).
  const tz = await loadTimezone()
  // Must match the same exclusion the home screen applies, or a user could
  // capture "this week's creature" for XP even though it's hidden from them
  // on Home (or vice versa) — see kingdomsToExcludeFromInterests.
  const excludedCreatureKingdoms = kingdomsToExcludeFromInterests(profileRow?.interests ?? [])
  const cotw = getCreatureOfWeek(tz, excludedCreatureKingdoms)
  const cotwKey = getWeekMeta(tz).key
  const claimedSet = new Set(questDelta.newClaimed)
  const matchesCotw =
    input.speciesId === cotw.id ||
    input.speciesName.trim().toLowerCase() === cotw.commonName.trim().toLowerCase() ||
    (input.dexNumber ?? '').replace(/^#/, '') === cotw.dexNumber.replace(/^#/, '')
  let cotwXp = 0
  if (matchesCotw && !claimedSet.has(cotwKey)) {
    claimedSet.add(cotwKey)
    cotwXp = cotw.bonusXp
  }

  const nextXp = (profileRow?.xp ?? 0) + xpGain + questDelta.xpGain + cotwXp
  const prevLevel = levelForTotalXp(profileRow?.xp ?? 0).level
  const nextLevel = levelForTotalXp(nextXp).level

  await supabase
    .from('profiles')
    .update({
      spots_captured: distinctSpecies,
      last_spotted_at: spottedAt,
      streak_days: nextStreak,
      xp: nextXp,
      level: nextLevel,
      badges_count: (profileRow?.badges_count ?? 0) + questDelta.badgeGain,
      claimed_quests: [...claimedSet],
    })
    .eq('id', userId)

  // In-app notifications (local feed) — fire-and-forget.
  if (isNewSpecies) {
    void addNotification({
      title: 'New species!',
      body: `${input.speciesName} added to your Dex`,
      icon: 'sparkles',
    })
  }
  if (cotwXp > 0) {
    void addNotification({
      title: 'Creature of the Week collected!',
      body: `${cotw.commonName} · +${cotwXp} XP`,
      icon: 'flame',
      dedupeKey: `collected-${cotwKey}`,
    })
  }
  if (questDelta.badgeGain > 0) {
    void addNotification({
      title: questDelta.badgeGain > 1 ? `${questDelta.badgeGain} quests complete!` : 'Quest complete!',
      body: questDelta.xpGain > 0 ? `+${questDelta.xpGain} XP` : undefined,
      icon: 'trophy',
    })
  }
  if (nextLevel > prevLevel) {
    void addNotification({
      title: `You reached level ${nextLevel}!`,
      body: 'Keep spotting to level up again',
      icon: 'ribbon',
    })
  }

  // ─── Nearby (community_sightings) gate ──────────────────────────────────────
  // Sharing is PER-IMAGE. A capture becomes public ONLY if the user explicitly
  // shared THIS capture via Confirm Pin (publishToMap + a confirmed pin). We use
  // the confirmed pin coordinates — never raw device GPS. Children never share.
  const isChild =
    (profileRow?.age_group ?? '').toLowerCase().includes('under') ||
    profileRow?.requires_parent_setup === true
  const confirmedLat = input.manualLatitude ?? null
  const confirmedLng = input.manualLongitude ?? null
  const hasConfirmedPin = confirmedLat != null && confirmedLng != null
  const optedIntoShare = input.publishToMap === true
  const shareIdentity = input.shareAnonymously === false ? 'public' : 'anonymous'

  const willCreateCommunitySighting = !isChild && optedIntoShare && hasConfirmedPin

  console.log('ADD TO COLLECTION PRIVACY CHECK', {
    userId,
    optedIntoShare,
    hasConfirmedPin,
    isChild,
    willCreateCommunitySighting,
  })

  if (willCreateCommunitySighting) {
    await supabase.from('community_sightings').insert({
      species_name: input.speciesName.trim(),
      species_id: speciesId,
      kingdom: input.kingdom,
      latitude: confirmedLat,
      longitude: confirmedLng,
      privacy: shareIdentity,
      // Keep user_id for ownership/delete + RLS; anonymity is enforced by the
      // Nearby query, which only exposes the username when privacy === 'public'.
      user_id: userId,
      report_count: 1,
      spotted_at: spottedAt,
      source_user_sighting_id: insertedSighting?.id ?? null,
      was_user_confirmed_pin: true,
    })
    console.log('COMMUNITY SIGHTING CREATED', {
      sourceUserSightingId: insertedSighting?.id ?? null,
      latitude: confirmedLat,
      longitude: confirmedLng,
      privacy: shareIdentity,
      wasUserConfirmedPin: true,
    })
  } else {
    console.log('COMMUNITY SIGHTING CREATE SKIPPED', {
      reason: isChild ? 'child_account' : !optedIntoShare ? 'not_shared' : 'no_confirmed_pin',
    })
  }

  // Classify the sighting's habitat in the background (Places badges). Never blocks save.
  if (insertedSighting?.id && latitude != null && longitude != null) {
    void storeHabitatsForSighting({
      sightingId: insertedSighting.id,
      latitude,
      longitude,
      homeLatitude: profileRow?.latitude ?? null,
      homeLongitude: profileRow?.longitude ?? null,
    })
  }

  notifyAccountProfileChanged()

  return { ok: true, isNewSpecies }
}
