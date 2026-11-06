'use client'

import { useEffect, useState } from 'react'

import { minuteMs } from '../duration.constants'

/** The current time, refreshed every `intervalMs`, for labels such as "2 min ago". */
export function useNow(intervalMs = minuteMs): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date())
    }, intervalMs)
    return () => {
      clearInterval(timer)
    }
  }, [intervalMs])

  return now
}
