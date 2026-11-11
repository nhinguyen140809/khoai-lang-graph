import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { useValueLabelOf } from '../useValueLabelOf'

describe('useValueLabelOf', () => {
  it('gives the title that the value list of the definition gives, for each value', () => {
    const { result } = renderHook(() =>
      useValueLabelOf(
        { path: 'spec_requirement.priority', valueList: 'priority' },
        workflowDefinitionFixture,
      ),
    )

    expect(result.current('must')).toBe('Must have')
    expect(result.current('could')).toBe('Could have')
  })

  it('gives the written label of the field, for a field that names no list', () => {
    const field = { path: 'persona.interview_status', valueList: null }
    const { result } = renderHook(() => useValueLabelOf(field, undefined))

    expect(result.current('completed')).toBe('Interviewed')
  })
})
