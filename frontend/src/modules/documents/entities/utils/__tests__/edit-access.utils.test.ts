import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'

import type { EditAccess, EditLockReason } from '../../types/documents.types'
import { editAccessOf } from '../edit-access.utils'
import { editAccessCases } from './edit-access.utils.data'

describe('editAccessOf', () => {
  it.each(editAccessCases)('gives $name', ({ runStatus, interrupt, artifactId, expected }) => {
    expect(editAccessOf({ runStatus, interrupt, artifactId })).toEqual(expected)
  })

  it('keeps the order of the table: the run that works comes before anything else', () => {
    const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')

    expect(
      editAccessOf({
        runStatus: 'running',
        interrupt: {
          allow_edits: true,
          review_artifacts: [
            { artifact_id: analysis.id, kind: analysis.kind, title: analysis.title, version: analysis.version },
          ],
        },
        artifactId: analysis.id,
      }),
    ).toEqual<EditAccess>({ canEdit: false, reason: 'agentsWorking' satisfies EditLockReason })
  })
})
