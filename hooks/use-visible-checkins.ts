'use client'

import { useEffect, useState } from 'react'
import { isCheckinVisible } from '@/lib/checkin-visibility'

/** Derive display rows only; never change query-cache data or reward eligibility. */
export function useVisibleCheckins<T>(items: readonly T[], timestamp: (item: T) => string | null | undefined): T[] {
  const [now, setNow] = useState<number | null>(null)
  useEffect(() => {
    const update = () => setNow(Date.now())
    update()
    const timer = window.setInterval(update, 1000)
    window.addEventListener('focus', update)
    return () => {
      window.clearInterval(timer)
      window.removeEventListener('focus', update)
    }
  }, [])
  return now === null ? [] : items.filter((item) => isCheckinVisible(timestamp(item), now))
}
