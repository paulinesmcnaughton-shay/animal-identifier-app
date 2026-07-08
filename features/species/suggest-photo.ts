import { Alert } from 'react-native'

import { CONSENT_TEXT, CONSENT_VERSION } from '@/components/species/PhotoConsentSheet'
import { getSupabaseClient } from '@/lib/supabase/client'

export type SuggestPhotoSource = 'camera' | 'library'

export interface SuggestPhotoInput {
  speciesId: string
  speciesName: string
  latinName?: string | null
  kingdom?: string | null
  dexNumber?: string | null
  isDomestic?: boolean
  source: SuggestPhotoSource
}

export type SuggestPhotoResult =
  | { status: 'submitted' }
  | { status: 'cancelled' }
  | { status: 'signed-out' }
  | { status: 'error'; message: string }

async function getImagePicker() {
  return import('expo-image-picker')
}

async function pickPhoto(source: SuggestPhotoSource): Promise<string | null> {
  const ImagePicker = await getImagePicker()
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Camera access needed', 'Allow camera access to share a photo of this species.')
      return null
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    })
    return result.canceled ? null : (result.assets[0]?.uri ?? null)
  }
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
  if (!perm.granted) {
    Alert.alert('Photos access needed', 'Allow photo library access to share a photo of this species.')
    return null
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.85,
  })
  return result.canceled ? null : (result.assets[0]?.uri ?? null)
}

// Lets a signed-in user submit a photo for a species that has no reference image.
// The file lands in a PRIVATE bucket and a pending suggestion row — nothing is shown
// to other users until it's reviewed and approved. Consent is REQUIRED — the caller
// only reaches this after the user has checked the consent box in PhotoConsentSheet;
// the exact wording is stored with the row (consent_text/consent_version) so it stays
// legally defensible even if the copy changes later. The database also enforces this
// (insert RLS requires consent_given = true) — this isn't just a client-side check.
export async function suggestSpeciesPhoto(input: SuggestPhotoInput): Promise<SuggestPhotoResult> {
  const supabase = getSupabaseClient()
  if (!supabase) return { status: 'error', message: 'Something went wrong. Try again.' }

  const { data: authData } = await supabase.auth.getUser()
  const userId = authData.user?.id
  if (!userId) return { status: 'signed-out' }

  const uri = await pickPhoto(input.source)
  if (!uri) return { status: 'cancelled' }

  try {
    // RN: read as ArrayBuffer — Blob uploads 0 bytes in React Native.
    const response = await fetch(uri)
    const arrayBuffer = await response.arrayBuffer()
    if (arrayBuffer.byteLength === 0) return { status: 'error', message: "That photo couldn't be read. Try another." }

    const stamp = `${input.speciesId}-${Date.now()}`.replace(/[^a-zA-Z0-9-]/g, '_')
    const storagePath = `${userId}/${stamp}.jpg`
    const { error: uploadError } = await supabase.storage
      .from('photo-suggestions')
      .upload(storagePath, arrayBuffer, { contentType: 'image/jpeg', upsert: false })
    if (uploadError) return { status: 'error', message: 'Upload failed. Try again.' }

    const { error: insertError } = await supabase.from('species_photo_suggestions').insert({
      species_id: input.speciesId,
      species_name: input.speciesName,
      latin_name: input.latinName ?? null,
      kingdom: input.kingdom ?? null,
      dex_number: input.dexNumber ?? null,
      is_domestic: input.isDomestic ?? false,
      submitted_by: userId,
      storage_path: storagePath,
      consent_given: true,
      consent_version: CONSENT_VERSION,
      consent_text: CONSENT_TEXT,
      consented_at: new Date().toISOString(),
    })
    if (insertError) return { status: 'error', message: 'Could not submit. Try again.' }

    return { status: 'submitted' }
  } catch {
    return { status: 'error', message: 'Something went wrong. Try again.' }
  }
}
