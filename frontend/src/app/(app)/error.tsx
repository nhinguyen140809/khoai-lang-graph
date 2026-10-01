'use client'

import { Button } from '@/components/ui/button'

interface RouteErrorProps {
  error: Error
  reset: () => void
}

/** Error boundary for every route inside the app shell. */
export default function RouteError({ error, reset }: RouteErrorProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">{error.message}</p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
