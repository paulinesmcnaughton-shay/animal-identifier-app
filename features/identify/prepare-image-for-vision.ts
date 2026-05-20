import * as ImageManipulator from 'expo-image-manipulator'

import { normalizeImageUri } from './read-image-base64'

const MAX_EDGE_PX = 1280
const JPEG_QUALITY = 0.78

export async function prepareImageForVision(uri: string): Promise<string> {
  const normalized = normalizeImageUri(uri)

  try {
    const result = await ImageManipulator.manipulateAsync(
      normalized,
      [{ resize: { width: MAX_EDGE_PX } }],
      {
        compress: JPEG_QUALITY,
        format: ImageManipulator.SaveFormat.JPEG,
      },
    )
    return result.uri
  } catch (error) {
    if (__DEV__) {
      console.warn('[Wildr] image resize failed, using original photo', error)
    }
    return normalized
  }
}
