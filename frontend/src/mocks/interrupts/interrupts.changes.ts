import { reviewStatus } from '@/modules/artifact/entities'
import type { Interrupt, ResumeRunBody } from '@/modules/review/entities'
import type { Run } from '@/modules/run/entities'
import { edgesFrom, findNode } from '@/modules/workflow/entities'

import { changeArtifact, changeItem } from '../artifacts/artifacts.changes'
import { allItems, findArtifact } from '../artifacts/artifacts.lookup'
import { changeRun } from '../runs/runs.changes'
import { mockNow, userId } from '../shared/db'
import { workflowDefinitionFixture } from '../workflow/workflow.fixtures'
import { interruptEdits } from './interrupts.store'

/**
 * Answers the pending interrupt of a run: the interrupt is resolved, the artifacts under review
 * are approved when the chosen option approves, and the run goes on at the stage of the option.
 */
export function resolveInterrupt(run: Run, interrupt: Interrupt, decision: ResumeRunBody): void {
  interruptEdits.set({
    ...interruptEdits.get(),
    [interrupt.id]: {
      status: 'resolved',
      resolved_at: mockNow(),
      decision: {
        option: decision.option,
        feedback: decision.feedback,
        answers: decision.answers,
        decided_by: userId,
        decided_at: mockNow(),
      },
    },
  })
  const option = interrupt.options.find(({ key }) => key === decision.option)
  if (option?.approves === true) approveArtifacts(interrupt.review_artifacts)
  changeRun(run.id, {
    status: 'running',
    current_stage: stageAfterOption(interrupt.node, decision.option),
  })
}

// What an approval changes: the artifacts under review become approved, and each of their items
// that is still draft, each as a new version with the change reason of a review.
function approveArtifacts(refs: Interrupt['review_artifacts']): void {
  for (const { artifact_id } of refs) {
    for (const item of allItems().filter((item) => item.artifact_id === artifact_id)) {
      if (item.review_status === reviewStatus.draft) {
        changeItem(item, { review_status: reviewStatus.approved }, 'reviewed')
      }
    }
    const artifact = findArtifact(artifact_id)
    if (artifact !== undefined) {
      changeArtifact(artifact, { review_status: reviewStatus.approved }, 'reviewed')
    }
  }
}

// The stage that the run goes on at after an answer: the stage of the node that the edge of the
// chosen option leads to; the first edge for an interrupt that asks questions only, and `done`
// for a node the definition gives no stage.
function stageAfterOption(nodeId: string, option: string | null): string {
  const edges = edgesFrom(workflowDefinitionFixture, nodeId)
  const target =
    option === null
      ? edges[0]?.target
      : edges.find(({ option: edgeOption }) => edgeOption === option)?.target
  const targetNode = target === undefined ? null : findNode(workflowDefinitionFixture, target)
  if (targetNode === null) return 'done'
  return 'stage' in targetNode ? targetNode.stage : 'done'
}
