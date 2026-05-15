import { useState } from 'react'

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<string[]>([])
  return { unlocked, setUnlocked }
}
