import { describe, expect, it } from 'vitest'
import definition from '@/mocks/data/workflow/requirements_engineering.v1.json'

import { workflowDefinitionSchema } from '../definition.types'

describe('workflow definition schema', () => {
  it('parses the served definition JSON', () => {
    const parsed = workflowDefinitionSchema.safeParse(definition)
    if (!parsed.success) {
      throw new Error(parsed.error.issues.map((i) => `${String(i.path)}: ${i.message}`).join('\n'))
    }
    expect(parsed.data.nodes.length).toBeGreaterThan(10)
    expect(parsed.data.edges.length).toBeGreaterThan(20)
  })
})
