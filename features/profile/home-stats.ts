export const NEW_USER_LEVEL = 1
export const NEW_USER_STREAK_DAYS = 0
export const NEW_USER_SPOTS_CAPTURED = 0
export const NEW_USER_WEEKLY_QUEST_CURRENT = 0
export const NEW_USER_WEEKLY_QUEST_TOTAL = 3
export const NEW_USER_WEEKLY_QUEST_TITLE = 'Spot 3 insects this week'
export const NEW_USER_WEEKLY_QUEST_XP_REWARD = 50
export const NEW_USER_XP = 0
export const NEW_USER_RARE_SPOTTED = 0
export const NEW_USER_BADGES_COUNT = 0

const WEEKLY_QUEST_EMOJIS = ['🪲', '🐝', '🦋', '🐛', '🦗'] as const

export interface WeeklyQuestProgress {
  title: string
  daysLeft: number
  current: number
  total: number
  xpReward: number
  progressEmoji: string[]
}

export function daysLeftInWeeklyQuest(weekStartedAt: string | null): number {
  const start = weekStartedAt ? new Date(weekStartedAt) : new Date()
  const end = new Date(start)
  end.setDate(end.getDate() + 7)
  const msLeft = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(msLeft / 86_400_000))
}

export function weeklyQuestProgressEmoji(current: number): string[] {
  const count = Math.max(0, Math.min(current, WEEKLY_QUEST_EMOJIS.length))
  return WEEKLY_QUEST_EMOJIS.slice(0, count)
}

export function buildWeeklyQuestProgress(input: {
  title: string
  current: number
  total: number
  xpReward: number
  weekStartedAt: string | null
}): WeeklyQuestProgress {
  return {
    title: input.title,
    current: input.current,
    total: input.total,
    xpReward: input.xpReward,
    daysLeft: daysLeftInWeeklyQuest(input.weekStartedAt),
    progressEmoji: weeklyQuestProgressEmoji(input.current),
  }
}

export function newUserWeeklyQuest(): WeeklyQuestProgress {
  return buildWeeklyQuestProgress({
    title: NEW_USER_WEEKLY_QUEST_TITLE,
    current: NEW_USER_WEEKLY_QUEST_CURRENT,
    total: NEW_USER_WEEKLY_QUEST_TOTAL,
    xpReward: NEW_USER_WEEKLY_QUEST_XP_REWARD,
    weekStartedAt: new Date().toISOString(),
  })
}
