import { prepareImageForVision } from '@/features/identify/prepare-image-for-vision'
import { runIdentificationPipeline } from '@/features/identify/pipeline-router'
import type { IdentifyOutcome } from '@/features/identify/types'

export async function identifyAnimalOrPlant(uri: string): Promise<IdentifyOutcome> {
  const preparedUri = await prepareImageForVision(uri)
  return runIdentificationPipeline(preparedUri)
}
