interface WikiSummary {
  thumbnail?: { source?: string }
  originalimage?: { source?: string }
}

export async function fetchWikipediaImageUrl(name: string): Promise<string | null> {
  const trimmed = name.trim()
  if (!trimmed) return null
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(trimmed)}?redirect=true`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return null
    const json = (await res.json()) as WikiSummary
    return json.originalimage?.source?.trim() || json.thumbnail?.source?.trim() || null
  } catch {
    return null
  }
}
