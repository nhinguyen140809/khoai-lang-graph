import { artifactFixtures, itemFixtures } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'
import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { contentDisplayOf, type IssueKind } from '@/modules/workflow/entities/@x/artifact'
import { assertPresent } from '@/shared/lib/guards'

import type { Artifact } from '../../artifacts/artifacts.types'
import type { OutlineItem } from '../../items/items.types'
import type { KindView } from '../outline.types'

/** The kinds of the mentor platform as the outline reads them. */
export const kindViewFixtures: ReadonlyMap<string, KindView> = new Map(
  artifactKindFixtures.artifact_kinds.flatMap((artifactKind) =>
    [artifactKind, ...artifactKind.item_kinds].map(({ kind, schema }) => [
      kind,
      { title: schema.title, display: contentDisplayOf(schema), schema },
    ]),
  ),
)

export const issueKindFixtures: IssueKind[] = workflowDefinitionFixture.item_kinds.flatMap(
  ({ kind, issue }) =>
    issue === null
      ? []
      : [{ kind, statusField: issue.status_field, openValues: issue.open_values }],
)

/** The artifact of the mentor project of this kind, and its items in outline order with their depth. */
export function mentorDocument(kind: string): {
  artifact: Artifact
  items: OutlineItem[]
  itemKinds: string[]
} {
  const artifact = assertPresent(
    artifactFixtures.find(
      (candidate) => candidate.project_id === projectIds.mentor && candidate.kind === kind,
    ),
    `No mentor artifact of kind ${kind}`,
  )
  const defined = assertPresent(
    workflowDefinitionFixture.artifact_kinds.find((candidate) => candidate.kind === kind),
    `No defined kind ${kind}`,
  )
  const own = itemFixtures.filter((item) => item.artifact_id === artifact.id)
  const depthOf = (item: OutlineItem | (typeof own)[number]): number => {
    const parent = own.find(({ id }) => id === item.parent_item_id)
    return parent === undefined ? 1 : depthOf(parent) + 1
  }
  return {
    artifact,
    items: own.map((item) => ({ ...item, depth: depthOf(item) })),
    itemKinds: defined.item_kinds,
  }
}
