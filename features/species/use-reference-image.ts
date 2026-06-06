import { useCallback, useEffect, useRef, useState } from 'react'

import type { KingdomKey } from '@/design/atoms/KingdomBadge'
import {
  buildResolverIdentity,
  pickPreResolvedImage,
  referenceCategory,
  type ReferenceImageInput,
  type ReferenceImageSource,
} from '@/features/species/resolve-reference-image'
import { useTaxaPhoto } from '@/features/species/use-taxa-photo'

export interface UseReferenceImageResult {
  /** The reference image to display, or null → caller renders its gradient/placeholder. */
  uri: string | null
  source: ReferenceImageSource | null
  isResolving: boolean
  /**
   * Wire this to the rendered <Image onError>. When the chosen URL fails to LOAD
   * (e.g. a dead database/registry URL), the resolver drops it and escalates to the
   * next source (external iNat → Wikipedia → Wikimedia → Google). Local to this
   * component — never poisons the shared cache or another card.
   */
  onImageError: (failedUri?: string | null) => void
}

export interface ReferenceImageDebugContext {
  screen: string
  component: string
}

/**
 * THE single way every species surface resolves its reference image.
 *
 * Read-only: it never mutates the species/result object passed in. It returns a
 * URI for the UI to render. Priority (one source of truth, shared with
 * `resolveReferenceImage`):
 *   1. app registry  2. domestic registry (gated on isDomestic)  3. AI metadata
 *   4. external iNat → Wikipedia → Wikimedia (kingdom-validated, non-poisoning)
 *
 * NEVER pass a user sighting photo in here — those are resolved separately via
 * `getSightingPhotoUri` and only shown on sighting rows / map pins / capture preview.
 */
export function useReferenceImage(
  input: ReferenceImageInput,
  debug?: ReferenceImageDebugContext,
): UseReferenceImageResult {
  // URLs that failed to LOAD in this component — excluded so we escalate sources.
  const [failedUris, setFailedUris] = useState<ReadonlySet<string>>(EMPTY_SET)
  const onImageError = useCallback((failedUri?: string | null) => {
    const u = failedUri?.trim()
    if (!u) return
    setFailedUris((prev) => (prev.has(u) ? prev : new Set(prev).add(u)))
  }, [])

  // Reset failed URLs when the species changes (incl. recycled FlatList cells).
  const identityKey = buildResolverIdentity(input)
  const prevIdentityRef = useRef(identityKey)
  useEffect(() => {
    if (prevIdentityRef.current !== identityKey) {
      prevIdentityRef.current = identityKey
      setFailedUris(EMPTY_SET)
    }
  }, [identityKey])

  // 1-3: synchronous, instant — no flash, no network. A pre-resolved URL that has
  // already failed to load is skipped so we fall through to the external lookup.
  const preResolvedRaw = pickPreResolvedImage(input)
  const preResolved = preResolvedRaw && !failedUris.has(preResolvedRaw.uri) ? preResolvedRaw : null
  const needsExternal = !preResolved

  // 4: external lookup. The hook is ALWAYS called (stable hook order); when a
  // pre-resolved URL exists we pass null so it short-circuits to a no-op.
  // Identity (species_id/dex/taxon/category) keeps same-name species distinct.
  const { url: taxaPhotoUrl, isResolving, source: externalSource } = useTaxaPhoto(
    needsExternal ? input.commonName : null,
    input.kingdom,
    needsExternal ? input.scientificName : null,
    needsExternal ? identityKey : null,
  )
  const externalUri = taxaPhotoUrl && !failedUris.has(taxaPhotoUrl) ? taxaPhotoUrl : null

  const uri = preResolved?.uri ?? externalUri
  const source: ReferenceImageSource | null = preResolved
    ? preResolved.source
    : externalUri
      ? externalSource ?? 'inaturalist'
      : isResolving
        ? null
        : 'needs_id_placeholder'

  useReferenceImagePipelineLog({ input, debug, preResolvedSource: preResolved?.source ?? null, taxaPhotoUrl: externalUri, externalSource, uri, source, isResolving })

  return { uri, source, isResolving, onImageError }
}

const EMPTY_SET: ReadonlySet<string> = new Set()

interface PipelineLogArgs {
  input: ReferenceImageInput
  debug?: ReferenceImageDebugContext
  preResolvedSource: ReferenceImageSource | null
  taxaPhotoUrl: string | null
  externalSource: ReferenceImageSource | null
  uri: string | null
  source: ReferenceImageSource | null
  isResolving: boolean
}

function useReferenceImagePipelineLog(args: PipelineLogArgs): void {
  const { input, debug, preResolvedSource, taxaPhotoUrl, externalSource, uri, source, isResolving } = args
  // Only log once per settled (uri, source) pair to avoid render spam.
  const lastLoggedRef = useRef<string>('')

  useEffect(() => {
    if (!__DEV__) return
    if (isResolving) return
    const signature = `${uri ?? ''}|${source ?? ''}`
    if (lastLoggedRef.current === signature) return
    lastLoggedRef.current = signature

    console.log('REFERENCE IMAGE PIPELINE', {
      screen: debug?.screen ?? 'unknown',
      component: debug?.component ?? 'unknown',
      commonName: input.commonName,
      scientificName: input.scientificName ?? null,
      speciesId: input.speciesId ?? null,
      dexNum: input.dexNum ?? null,
      taxonId: input.taxonId ?? null,
      kingdom: input.kingdom ?? null,
      category: referenceCategory(input),
      // Reference resolver NEVER sees the user's sighting photo — always null here.
      userPhotoUri: null,
      databaseImage: preResolvedSource === 'database' ? input.appRegistryImageUrl ?? null : null,
      domesticRegistryImage: preResolvedSource === 'domestic_registry' ? input.domesticRegistryImageUrl ?? null : null,
      inaturalistImage: externalSource === 'inaturalist' ? taxaPhotoUrl : null,
      wikipediaImage: externalSource === 'wikipedia' || externalSource === 'wikimedia' ? taxaPhotoUrl : null,
      googleImage: externalSource === 'google' ? taxaPhotoUrl : null,
      aiImage: preResolvedSource === 'ai_metadata' ? input.aiImageUrl ?? null : null,
      finalUri: uri,
      source: source ?? 'needs_id_placeholder',
      reason: source ?? 'no_image_found',
    })
  }, [debug?.screen, debug?.component, input, preResolvedSource, taxaPhotoUrl, externalSource, uri, source, isResolving])
}

// Re-export for convenience so callers import from one place.
export type { KingdomKey, ReferenceImageInput }
