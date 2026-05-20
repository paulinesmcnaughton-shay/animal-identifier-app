import Constants from 'expo-constants'

interface SupabaseExtra {
  supabaseUrl?: string
  supabasePublishableKey?: string
  SUPABASE_URL?: string
  SUPABASE_PUBLISHABLE_KEY?: string
}

function readExtra(): SupabaseExtra {
  return (Constants.expoConfig?.extra ?? {}) as SupabaseExtra
}

export function getSupabaseUrl(): string {
  const extra = readExtra()
  return (extra.supabaseUrl ?? extra.SUPABASE_URL ?? '').trim()
}

export function getSupabasePublishableKey(): string {
  const extra = readExtra()
  return (extra.supabasePublishableKey ?? extra.SUPABASE_PUBLISHABLE_KEY ?? '').trim()
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseUrl().length > 0 && getSupabasePublishableKey().length > 0
}
