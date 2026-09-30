import type { ErrorComponentProps } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'

/** Default error boundary for every route (set as `defaultErrorComponent` on the router). */
export function RouteError({ error, reset }: ErrorComponentProps) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 p-6">
      <h2 className="text-lg font-semibold">Something went wrong</h2>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : 'Unknown error'}
      </p>
      <Button variant="outline" onClick={reset}>
        Try again
      </Button>
    </div>
  )
}
