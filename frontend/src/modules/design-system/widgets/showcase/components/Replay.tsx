'use client'

import { RotateCcwIcon } from 'lucide-react'
import { type ReactNode, useEffect, useState } from 'react'

import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'

import { SampleGroup, SampleLabel } from './Sample'

/**
 * A sample of a motion that nobody operates: it plays again on its own every few seconds, and
 * again at once on the button. With `remount` the sample is built anew on each run, which shows
 * how things come in; without it the same sample stays and the run number changes, which shows
 * how it goes out and back, or how a value reacts to a change.
 */
export function Replay({
  label,
  every = 2400,
  remount = true,
  className,
  children,
}: {
  label: string
  /** The time between two plays, in milliseconds. */
  every?: number
  remount?: boolean
  className?: string
  children: (run: number) => ReactNode
}) {
  const [run, setRun] = useState(0)
  const [auto, setAuto] = useState(true)

  useEffect(() => {
    if (!auto) return
    const timer = setInterval(() => {
      setRun((current) => current + 1)
    }, every)
    return () => {
      clearInterval(timer)
    }
  }, [auto, every])

  return (
    <SampleGroup label={label}>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="xs"
          onClick={() => {
            setRun((current) => current + 1)
          }}
        >
          <RotateCcwIcon data-icon="inline-start" />
          Replay
        </Button>
        <Switch
          size="sm"
          checked={auto}
          onCheckedChange={setAuto}
          aria-label={`Play ${label} on its own`}
        />
        <SampleLabel>auto</SampleLabel>
      </div>
      <div key={remount ? run : 'same'} className={className}>
        {children(run)}
      </div>
    </SampleGroup>
  )
}
