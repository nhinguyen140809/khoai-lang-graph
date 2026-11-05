import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/db'
import { artifactKindFixtures } from '@/mocks/workflow/artifact-kinds.fixtures'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { holdResponse, serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'

import { useArtifactDocument } from '../useArtifactDocument'

const analysis = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')
const interview = artifactFixtureByKind(
  projectIds.mentor,
  'interview_transcript',
  'Interview with Minh',
)

describe('useArtifactDocument', () => {
  it('is pending until the artifact, its items and its schema load', () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(analysis.id))

    expect(result.current.state).toBe('pending')
  })

  it('stays pending while the schema of the artifact loads, so that a transcript never shows first as a document', async () => {
    const { held, release } = holdResponse()
    server.use(
      http.get(apiEndpoints.artifactKinds.pattern, async () => {
        await held
        return HttpResponse.json(artifactKindFixtures)
      }),
    )
    const { result } = renderHookWithProviders(() => useArtifactDocument(interview.id))

    await waitFor(() => {
      expect(result.current.state).not.toBe('pending')
    }).catch(() => undefined)
    expect(result.current.state).toBe('pending')
    release()
  })

  it('gives the artifact, its blocks and the kinds that draw them', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(analysis.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const document = result.current
    if (document.state !== 'success') throw new Error('The document did not load')
    expect(document.artifact.id).toBe(analysis.id)
    expect(document.blocks.length).toBeGreaterThan(0)
    expect(document.kinds.size).toBeGreaterThan(0)
  })

  it('reads the layout of the document and the people of its conversation from its schema', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(interview.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const document = result.current
    if (document.state !== 'success') throw new Error('The document did not load')
    expect(document.display).toBe('transcript')
    expect(document.participants.map(({ key }) => key)).toEqual(['interviewer', 'PER-001'])
    expect(document.participants[1]?.itemId).toBe(itemFixtureByKey(projectIds.mentor, 'PER-001').id)
  })

  it('reads a document whose schema fails as a document, with no fields and no participants', async () => {
    server.use(
      http.get(apiEndpoints.artifact.path({ artifactId: interview.id }), () =>
        // A schema version the kinds do not hold, so its schema loads on its own and fails.
        HttpResponse.json({ ...interview, schema_version: 2 }),
      ),
      serverErrorOn(HttpMethod.Get, apiEndpoints.contentSchema.pattern),
    )
    const { result } = renderHookWithProviders(() => useArtifactDocument(interview.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const document = result.current
    if (document.state !== 'success') throw new Error('The document did not load')
    expect(document.display).toBe('document')
    expect(document.fields).toEqual([])
    expect(document.participants).toEqual([])
  })

  it('reads a document that names no layout as a document, with no participants', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument(analysis.id))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const document = result.current
    if (document.state !== 'success') throw new Error('The document did not load')
    expect(document.display).toBe('document')
    expect(document.participants).toEqual([])
  })

  it('gives the filled fields of an artifact in the order of its schema', async () => {
    const plan = artifactFixtureByKind(projectIds.mentor, 'elicitation_plan')
    const { result } = renderHookWithProviders(() => useArtifactDocument(plan.id))

    await waitFor(() => {
      expect(result.current.state === 'success' && result.current.fields.length).toBeGreaterThan(0)
    })
    const document = result.current
    expect(document.state === 'success' && document.fields.map(({ name }) => name)).toContain(
      'objectives',
    )
  })

  it('says not found for an artifact that does not exist', async () => {
    const { result } = renderHookWithProviders(() => useArtifactDocument('missing-artifact'))

    await waitFor(() => {
      expect(result.current.state).toBe('notFound')
    })
  })
})
