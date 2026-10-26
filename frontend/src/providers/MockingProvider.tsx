'use client'

import { type ReactNode, useEffect, useState } from 'react'

const isMockingEnabled = process.env.NEXT_PUBLIC_API_MOCKING === 'enabled'

// Started at most once: effects run twice under Strict Mode and the worker rejects a second start.
let workerStarted: Promise<unknown> | undefined

function startWorker() {
  workerStarted ??= import('@/mocks/msw-browser.setup').then(({ worker }) =>
    worker.start({ onUnhandledRequest: 'bypass' }),
  )
  return workerStarted
}

interface MockingProviderProps {
  children: ReactNode
}

/**
 * With NEXT_PUBLIC_API_MOCKING=enabled, starts the MSW worker and renders the app only once it
 * is ready, so no request reaches the network before the mocks are in place.
 */
export function MockingProvider({ children }: MockingProviderProps) {
  const [ready, setReady] = useState(!isMockingEnabled)

  useEffect(() => {
    if (!isMockingEnabled) return
    let isCancelled = false
    void startWorker().then(() => {
      if (!isCancelled) setReady(true)
    })
    return () => {
      isCancelled = true
    }
  }, [])

  return ready ? children : null
}
