type AccountProfileListener = () => void

const listeners = new Set<AccountProfileListener>()

export function subscribeAccountProfile(listener: AccountProfileListener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Call after display name or username is saved so Me / Spot update immediately. */
export function notifyAccountProfileChanged(): void {
  listeners.forEach((listener) => {
    listener()
  })
}
