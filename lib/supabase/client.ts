import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/config'

import type { Database } from '@/lib/supabase/database.types'

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return client
}
