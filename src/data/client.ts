/**
 * HTTP client with auth header injection — extend when API exists.
 */
const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? ''

export interface RequestOptions extends RequestInit {
  json?: unknown
}

export async function apiFetch(path: string, options: RequestOptions = {}) {
  const { json, headers, ...rest } = options
  const url = path.startsWith('http') ? path : `${baseUrl}${path}`
  const body = json !== undefined ? JSON.stringify(json) : options.body
  const res = await fetch(url, {
    ...rest,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API ${res.status}: ${text}`)
  }
  return res.json() as Promise<unknown>
}
