import * as FileSystem from 'expo-file-system/legacy'

import { IdentifyError } from './types'

export function normalizeImageUri(uri: string): string {
  const trimmed = uri.trim()
  if (trimmed.startsWith('file://') || trimmed.startsWith('content://') || trimmed.startsWith('ph://')) {
    return trimmed
  }
  return `file://${trimmed}`
}

export async function readImageBase64(uri: string): Promise<string> {
  const normalized = normalizeImageUri(uri)
  try {
    const base64 = await FileSystem.readAsStringAsync(normalized, {
      encoding: FileSystem.EncodingType.Base64,
    })
    if (!base64 || base64.length < 100) {
      throw new IdentifyError('Photo file was empty. Take the picture again.', 'API')
    }
    return base64.replace(/\s/g, '')
  } catch (error) {
    if (error instanceof IdentifyError) throw error
    throw new IdentifyError('Could not read the photo. Try again.', 'API')
  }
}
