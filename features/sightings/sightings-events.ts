type SightingsListener = () => void

const listeners = new Set<SightingsListener>()

export function subscribeSightingsChanged(listener: SightingsListener): () => void {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function notifySightingsChanged(): void {
  listeners.forEach((listener) => { listener() })
}
