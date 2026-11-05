import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useItemHref } from '../useItemHref'

const projectId = projectIds.mentor

describe('useItemHref', () => {
  it('opens the page of a requirement', () => {
    const requirement = itemFixtureByKey(projectId, 'REQ-001')
    const { result } = renderHookWithProviders(() => useItemHref(projectId))

    expect(result.current(requirement)).toBe(`/projects/${projectId}/items/${requirement.id}`)
  })

  it('opens the transcript of the artifact of a message, at the message', async () => {
    const transcript = artifactFixtureByKind(projectId, 'interview_transcript')
    const message = itemFixtureByKey(projectId, 'PER-001#2')
    const { result } = renderHookWithProviders(() => useItemHref(projectId))

    await waitFor(() => {
      expect(result.current(message)).toBe(
        `/projects/${projectId}/documents/${transcript.id}?item=${message.id}`,
      )
    })
  })
})
