import { addNotification } from '@/features/notifications/notifications'
import { levelForTotalXp } from '@/features/profile/xp-progress'
import { notifyAccountProfileChanged } from '@/features/settings/account-profile-events'
import { getSupabaseClient } from '@/lib/supabase/client'

interface ClaimCreatureBonusInput {
  weekKey: string
  bonusXp: number
}

/**
 * Award the Creature of the Week bonus once for a creature the user ALREADY owns
 * (the "Collect XP" path). Gated by a `cotw:<year>-W<week>` key in
 * profiles.claimed_quests so it can't be double-claimed (capture-on-save uses the
 * same key). Returns the XP gained (0 if already claimed or unavailable).
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

  const nextXp = (row?.xp ?? 0) + bonusXp
  const { error } = await supabase
    .from('profiles')
    .update({ xp: nextXp, level: levelForTotalXp(nextXp).level, claimed_quests: [...claimed, weekKey] })
    .eq('id', userId)
  if (error) return 0

  void addNotification({
    title: 'Creature of the Week collected!',
    body: `+${bonusXp} XP`,
    icon: 'flame',
    dedupeKey: `collected-${weekKey}`,
  })
  notifyAccountProfileChanged()
  return bonusXp
}
