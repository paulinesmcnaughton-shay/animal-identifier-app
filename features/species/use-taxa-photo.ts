import { useEffect, useState } from 'react'

export function useTaxaPhoto(name: string): string | null {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetch(`https://api.inaturalist.org/v1/taxa?q=${encodeURIComponent(name)}&per_page=1`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          const photoUrl = data?.results?.[0]?.default_photo?.medium_url ?? null
          setUrl(photoUrl)
        }
      })
      .catch(() => {
        if (!cancelled) setUrl(null)
      })
    return () => {
      cancelled = true
    }
  }, [name])

  return url
}
