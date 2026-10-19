import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { apiUrl } from '@/shared/api/api-url.utils'

// The workflow definition of the docs, which the mock copies, from the folder of the frontend.
const documented: unknown = JSON.parse(
  readFileSync(resolve(process.cwd(), '../docs/workflow/requirements_engineering.v1.json'), 'utf8'),
)

describe('workflowHandlers', () => {
  it('answers the workflow definition of the docs', async () => {
    const response = await fetch(apiUrl('/api/v1/workflow/definition?version=1'))

    expect(await response.json()).toEqual(documented)
  })
})
