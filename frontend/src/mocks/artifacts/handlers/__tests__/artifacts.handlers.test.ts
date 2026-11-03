import { describe, expect, it } from 'vitest'

import type { Artifact, Revision } from '@/modules/artifact/entities'
import { apiEndpoints } from '@/shared/api/endpoints'
import { callApi, getApi, getApiItems, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import { projectIds } from '../../../shared/db'
import {
  analysis,
  artifactRejectedCases,
  scenarioCases,
  versionHeader,
} from './artifacts.handlers.data'

const artifactPath = apiEndpoints.artifact.path({ artifactId: analysis.id })

describe('the artifact handlers', () => {
  itRejectsRequests(artifactRejectedCases)

  it.each(scenarioCases)('answer the scenario of $name', async ({ page, path, status }) => {
    openPage(page)

    expect((await callApi({ method: 'GET', path })).status).toBe(status)
  })

  it('lists no artifact in the empty scenario', async () => {
    openPage('/?mock-artifacts=empty')

    const artifacts = await getApiItems<Artifact>(
      apiEndpoints.projectArtifacts.path({ projectId: projectIds.mentor }),
    )

    expect(artifacts).toEqual([])
  })

  it('gives a change a new version, and keeps the other versions readable', async () => {
    const saved = await callApi({
      method: 'PATCH',
      path: artifactPath,
      body: { title: 'Analysis of the interviews', summary: null },
      headers: versionHeader,
    })

    expect(saved.body).toMatchObject({
      title: 'Analysis of the interviews',
      summary: null,
      version: analysis.version + 1,
      updated_by: { actor: 'user' },
    })
    expect((await getApi<Artifact>(artifactPath)).title).toBe('Analysis of the interviews')
    const older = await getApi<Artifact>(`${artifactPath}?version=${String(analysis.version)}`)
    expect(older).toMatchObject({ version: analysis.version, content: analysis.content })
    const revisions = await getApiItems<Revision>(`${artifactPath}/revisions`)
    expect(revisions.map(({ version, change_reason }) => [version, change_reason])).toEqual([
      [analysis.version + 1, 'user_edit'],
      [4, 'rework'],
      [3, 'rework'],
      [2, 'rework'],
      [1, 'generated'],
    ])
  })

  it('merges the fields of a content into the content of the artifact', async () => {
    const saved = await callApi({
      method: 'PATCH',
      path: artifactPath,
      body: { content: { open_questions: ['How long is a session?'] } },
      headers: versionHeader,
    })

    expect(saved.body).toMatchObject({
      content: {
        open_questions: ['How long is a session?'],
        key_findings: analysis.content.key_findings,
      },
    })
  })

  it('makes an old version current again as a new version', async () => {
    const restored = await callApi({
      method: 'POST',
      path: `${artifactPath}/restore`,
      body: { version: 2 },
    })

    expect(restored.body).toMatchObject({
      version: analysis.version + 1,
      content: analysis.content,
    })
    const [latest] = await getApiItems<Revision>(`${artifactPath}/revisions`)
    expect(latest).toMatchObject({ change_reason: 'restored' })
  })
})
