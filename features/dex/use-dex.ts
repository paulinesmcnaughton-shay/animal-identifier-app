import { useMemo, useState } from 'react'

export function useDex() {
  const [collected, setCollected] = useState(0)
  const total = 247

  const progress = useMemo(() => (total > 0 ? collected / total : 0), [collected, total])

  return { collected, setCollected, total, progress }
}

export function useStreak() {
  const [days, setDays] = useState(0)
  return { days, setDays }
}
