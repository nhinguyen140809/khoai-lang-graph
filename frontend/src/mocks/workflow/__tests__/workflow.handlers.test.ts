import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpHeader, HttpMethod } from '@/shared/api/http'
import { callApi, openPage } from '@/test/msw'
import { itRejectsRequests } from '@/test/suites'

import type { workflowDefinitionWithEveryParameterType } from '../workflow.fixtures'
import { assistanceDefinitionFixture } from '../workflow.fixtures'
import { definitionRejectedCases } from './workflow.handlers.data'

// The definition file that the mock copies, read from the root of the repository.
const documented = JSON.parse(
  readFileSync(resolve(process.cwd(), '../docs/workflow/requirements_engineering.v2.json'), 'utf8'),
) as Record<string, unknown>

// The definition of the assistance workflow, which the mock copies the same way.
const documentedAssistance = JSON.parse(
  readFileSync(resolve(process.cwd(), '../docs/workflow/assistance.v1.json'), 'utf8'),
) as Record<string, unknown>

describe('the workflow handlers', () => {
  it('serve the definition of the docs', async () => {
    const answer = await callApi({
      method: HttpMethod.Get,
      path: apiEndpoints.workflowDefinition.path(),
    })

    expect(answer.body).toEqual(documented)
  })

  it('serve the definition of the workflow that a name gives, current or pinned', async () => {
    const current = await callApi({
      method: HttpMethod.Get,
      path: `${apiEndpoints.workflowDefinition.path()}?name=${assistanceDefinitionFixture.name}`,
    })
    const pinned = await callApi({
      method: HttpMethod.Get,
      path: `${apiEndpoints.workflowDefinition.path()}?name=${assistanceDefinitionFixture.name}&version=${String(assistanceDefinitionFixture.version)}`,
    })
    const missingVersion = await callApi({
      method: HttpMethod.Get,
      path: `${apiEndpoints.workflowDefinition.path()}?name=${assistanceDefinitionFixture.name}&version=${String(assistanceDefinitionFixture.version + 8)}`,
    })
    const unknown = await callApi({
      method: HttpMethod.Get,
      path: `${apiEndpoints.workflowDefinition.path()}?name=nothing`,
    })

    expect(current.body).toEqual(documentedAssistance)
    expect(pinned.body).toEqual(documentedAssistance)
    expect(missingVersion.status).toBe(404)
    expect(unknown.status).toBe(404)
  })

  it('serve the definition with every kind of run parameter in the all-types scenario', async () => {
    openPage('/?mock-run-parameters=all-types')

    const answer = await callApi({
      method: HttpMethod.Get,
      path: apiEndpoints.workflowDefinition.path(),
    })

    const parameters = (answer.body as typeof workflowDefinitionWithEveryParameterType)
      .run_parameters_schema.properties
    expect(Object.keys(parameters)).toEqual(
      expect.arrayContaining([
        'target_personas_num',
        'strict_review',
        'keep_transcripts',
        'interview_style',
      ]),
    )
    expect(parameters.interview_style).toMatchObject({ enum: ['structured', 'open', 'mixed'] })
  })

  it('let a version be kept for ever, and the current definition not', async () => {
    const path = apiEndpoints.workflowDefinition.path()
    const version = await callApi({ method: HttpMethod.Get, path: `${path}?version=2` })
    const current = await callApi({ method: HttpMethod.Get, path })

    expect(version.headers.get(HttpHeader.CacheControl)).toContain('immutable')
    expect(current.headers.get(HttpHeader.CacheControl)).toBeNull()
  })

  itRejectsRequests(definitionRejectedCases)
})
