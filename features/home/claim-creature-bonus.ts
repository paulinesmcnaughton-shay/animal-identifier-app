import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ClaimCreatureBonusInput {
  weekKey: string
  bonusXp: number
}

/**
 * Award the Creature of the Week bonus once. Gated by a `cotw:<year>-W<week>` key in
 * profiles.claimed_quests so it can't be claimed twice. Returns the XP gained (0 if
 * already claimed or unavailable).
 */
export async function claimCreatureBonus({ weekKey, bonusXp }: ClaimCreatureBonusInput): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) return 0

  const { data: auth } = await supabase.auth.getUser()
  const userId = auth.user?.id
  if (!userId) return 0

  const { data: row } = await supabase
    .from('profiles')
    .select('xp, claimed_quests')
    .eq('id', userId)
    .maybeSingle()

  const claimed = row?.claimed_quests ?? []
  if (claimed.includes(weekKey)) return 0

  const { error } = await supabase
    .from('profiles')
    .update({ xp: (row?.xp ?? 0) + bonusXp, claimed_quests: [...claimed, weekKey] })
    .eq('id', userId)
  if (error) return 0

  notifyAccountProfileChanged()
  return bonusXp
}
