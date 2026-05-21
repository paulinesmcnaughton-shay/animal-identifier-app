import * as SecureStore from 'expo-secure-store'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { getSupabasePublishableKey, getSupabaseUrl, isSupabaseConfigured } from '@/lib/supabase/config'
import type { Database } from '@/lib/supabase/database.types'

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
}

let client: SupabaseClient<Database> | null = null

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null
  if (!client) {
    client = createClient<Database>(getSupabaseUrl(), getSupabasePublishableKey(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storage: ExpoSecureStoreAdapter,
      },
    })
  }
  return client
}