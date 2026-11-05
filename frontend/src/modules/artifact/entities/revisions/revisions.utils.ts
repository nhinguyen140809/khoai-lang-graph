import type { WorkflowDefinition } from '@/modules/workflow/entities/@x/artifact'

import type { Origin } from '../artifacts/artifacts.types'
import { revisionMessages } from './revisions.constants'
import type { Revision, RevisionTarget } from './revisions.types'

// The rules of the versions of a record: who made one, which one comes right before another, and
// the keys that the stores of the features give to a record and to one of its versions.

/** Who made a version: "You" for the user, else the label of the agent role, else its key. */
export function revisionAuthor(
  origin: Pick<Origin, 'actor' | 'agent_role'>,
  definition: Pick<WorkflowDefinition, 'agent_roles'> | undefined,
): string {
  if (origin.actor === 'user') return revisionMessages.you
  const role =
    origin.agent_role === null || definition === undefined
      ? undefined
      : definition.agent_roles.find(({ key }) => key === origin.agent_role)
  return role?.label ?? origin.agent_role ?? revisionMessages.theAgents
}

/** The version right before the given one among the loaded ones, or undefined when it is not loaded. */
export function previousRevision(
  revisions: readonly Revision[],
  version: number,
): Revision | undefined {
  const older = revisions
    .filter((revision) => revision.version < version)
    .toSorted((a, b) => b.version - a.version)
  return older[0]
}

/** The key of a record in a store: `item:<id>` or `artifact:<id>`. */
export function recordKeyOf(target: RevisionTarget): string {
  return `${target.type}:${target.id}`
}

/** The key of one version of a record in a store: `item:<id>@2`. */
export function revisionKeyOf(target: RevisionTarget, version: number): string {
  return `${recordKeyOf(target)}@${String(version)}`
}

/** The record and the version of a key of `revisionKeyOf`, or null for another string. */
export function parseRevisionKey(key: string): { target: RevisionTarget; version: number } | null {
  const parsed = /^(item|artifact):([a-z0-9-]+)@(\d+)$/.exec(key)
  const [, kind, id, version] = parsed ?? []
  if (kind === undefined || id === undefined || version === undefined) return null
  return { target: { type: kind as 'item' | 'artifact', id }, version: Number(version) }
}
