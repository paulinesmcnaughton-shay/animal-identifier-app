import { useCallback, useState } from 'react'

export function useIdentify() {
  const [isBusy, setIsBusy] = useState(false)

  const processImage = useCallback(async (_uri: string) => {
    setIsBusy(true)
    try {
      // wire to API / on-device model
    } finally {
      setIsBusy(false)
    }
  }, [])

  return { isBusy, processImage }
}
