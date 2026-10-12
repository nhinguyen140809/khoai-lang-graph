'use client'

import type { Route } from 'next'
import Link from 'next/link'

import { ErrorState, LoadingState } from '@/components/state'

import { useWorkflowState } from '../hooks/useWorkflowState'

const linkClassName =
  'rounded-sm font-mono text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The address of what a reference points to, and its name; null when the value is no reference. */
function referenceOf(projectId: string, value: unknown): { href: string; label: string } | null {
  if (!isRecord(value)) return null
  const base = `/projects/${encodeURIComponent(projectId)}/artifacts`
  if (typeof value.item_id === 'string' && typeof value.key === 'string') {
    return {
      href: `${base}/items/${encodeURIComponent(value.item_id)}`,
      label: `${value.key} v${String(value.version)}`,
    }
  }
  if (typeof value.artifact_id === 'string' && typeof value.title === 'string') {
    return {
      href: `${base}/${encodeURIComponent(value.artifact_id)}`,
      label: `${value.title} v${String(value.version)}`,
    }
  }
  return null
}

function Value({ projectId, value }: { projectId: string; value: unknown }) {
  const reference = referenceOf(projectId, value)
  if (reference !== null) {
    return (
      <Link href={reference.href as Route} className={linkClassName}>
        {reference.label}
      </Link>
    )
  }
  if (Array.isArray(value)) {
    const list: unknown[] = value
    if (list.length === 0) return <span className="text-muted-foreground">none</span>
    return (
      <ul className="flex flex-wrap gap-x-3 gap-y-0.5">
        {list.map((entry, index) => (
          <li key={index}>
            <Value projectId={projectId} value={entry} />
          </li>
        ))}
      </ul>
    )
  }
  if (isRecord(value)) {
    const entries = Object.entries(value)
    if (entries.length === 0) return <span className="text-muted-foreground">empty</span>
    return <Tree projectId={projectId} values={value} />
  }
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>
  return (
    <span className="font-mono">
      {typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
        ? String(value)
        : ''}
    </span>
  )
}

function Tree({ projectId, values }: { projectId: string; values: Record<string, unknown> }) {
  return (
    <dl className="grid grid-cols-[minmax(8rem,14rem)_1fr] gap-x-3 gap-y-1">
      {Object.entries(values).map(([name, value]) => (
        <div key={name} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-muted-foreground">{name}</dt>
          <dd>
            <Value projectId={projectId} value={value} />
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface StatePanelProps {
  projectId: string
  runId: string
  /** The step whose state is shown; without one, the current state of the run. */
  stepId: string | null
  active: boolean
}

/** The workflow state after the chosen step, as a tree; what it refers to opens as a link. */
export function StatePanel({ projectId, runId, stepId, active }: StatePanelProps) {
  const state = useWorkflowState(runId, stepId, active)

  if (state.isPending) return <LoadingState label="Loading the state" rows={4} size="compact" />
  if (state.isError) {
    return (
      <ErrorState
        message={state.error.message}
        onRetry={() => void state.refetch()}
        size="compact"
      />
    )
  }
  return (
    <section aria-label="Workflow state" className="flex flex-col gap-2 p-4 text-xs">
      <p className="text-muted-foreground">
        {stepId === null ? 'The current state of the run.' : 'The state after the chosen step.'}
      </p>
      <Tree projectId={projectId} values={state.data.values} />
    </section>
  )
}
