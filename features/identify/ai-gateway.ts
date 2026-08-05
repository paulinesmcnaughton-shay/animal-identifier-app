import { getSupabaseClient } from '@/lib/supabase/client'
import { isSupabaseConfigured } from '@/lib/supabase/config'

import { IdentifyError } from './types'

// All third-party AI calls go through the ai-gateway edge function so provider
// keys stay server-side. See supabase/functions/ai-gateway.

export function canUseAiGateway(): boolean {
  return isSupabaseConfigured()
}

interface GatewayErrorBody {
  error?: string
  code?: string
}

function errorCode(code: unknown): 'NO_TOKEN' | 'API' {
  return code === 'NO_TOKEN' ? 'NO_TOKEN' : 'API'
}

export async function invokeAiGateway<T>(body: Record<string, unknown>): Promise<T> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    throw new IdentifyError('Identification is unavailable right now.', 'NO_TOKEN')
  }

  let data: T | null = null
  let invokeError: unknown = null
  try {
    const result = await supabase.functions.invoke<T>('ai-gateway', { body })
    data = result.data
    invokeError = result.error
  } catch {
    throw new IdentifyError('Network error — check Wi‑Fi and try again.', 'NETWORK')
  }

  if (invokeError) {
    let message = 'Identification failed. Try again.'
    let code: 'NO_TOKEN' | 'API' = 'API'
    const context = (invokeError as { context?: Response }).context
    if (context && typeof context.json === 'function') {
      try {
        const parsed = (await context.json()) as GatewayErrorBody
        if (parsed.error) message = parsed.error
        code = errorCode(parsed.code)
      } catch {
        // keep defaults
      }
    }
    throw new IdentifyError(message, code)
  }

  if (data == null) {
    throw new IdentifyError('Identification returned an empty response.', 'API')
  }

  return data
}
