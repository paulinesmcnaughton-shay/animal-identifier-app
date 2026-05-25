import type { Session, User } from '@supabase/supabase-js'

import { SETTINGS_DEFAULTS } from '@/features/settings/preferences'
import { TESTER_ACCOUNT_EMAIL } from '@/features/settings/tester-account'
import { storage } from '@/util/storage'

export const DEMO_SESSION_STORAGE_KEY = 'auth.demoMode'

const DEMO_USER_ID = 'demo-alex-riley'

export function createDemoSession(): Session {
  const now = new Date().toISOString()
  const user = {
    id: DEMO_USER_ID,
    email: TESTER_ACCOUNT_EMAIL,
    user_metadata: {
      username: SETTINGS_DEFAULTS.username,
      display_name: SETTINGS_DEFAULTS.displayName,
    },
    app_metadata: {},
    aud: 'authenticated',
    created_at: now,
  } as User

  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  } as Session
}

export async function isDemoSessionActive(): Promise<boolean> {
  return (await storage.getString(DEMO_SESSION_STORAGE_KEY)) === 'true'
}

export async function activateDemoSession(): Promise<Session> {
  await storage.set(DEMO_SESSION_STORAGE_KEY, 'true')
  return createDemoSession()
}

export async function deactivateDemoSession(): Promise<void> {
  await storage.delete(DEMO_SESSION_STORAGE_KEY)
}

export async function restoreDemoSession(): Promise<Session | null> {
  if (!(await isDemoSessionActive())) return null
  return createDemoSession()
}
