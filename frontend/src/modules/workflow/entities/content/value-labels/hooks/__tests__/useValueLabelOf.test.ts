import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { ViewProvider } from '@/shared/lib/view/ViewProvider'

import { useValueLabelOf } from '../useValueLabelOf'

// Wraps the hook in a provider of the given view.
function withView(view: 'user' | 'developer') {
  return ({ children }: { children: ReactNode }) => ViewProvider({ children, value: view })
}

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

  it('gives the written label of the field in each view, for a field that names no list', () => {
    const field = { path: 'persona.interview_status', valueList: null }
    const developer = renderHook(() => useValueLabelOf(field, undefined), {
      wrapper: withView('developer'),
    })
    const user = renderHook(() => useValueLabelOf(field, undefined), { wrapper: withView('user') })

    expect(developer.result.current('completed')).toBe('Completed')
    expect(user.result.current('completed')).toBe('Interviewed')
  })
})
