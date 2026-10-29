import { describe, expect, it } from 'vitest'

import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'

import { useIssueKinds } from '../useIssueQueries'

describe('useIssueKinds', () => {
  it('loads the kinds of item that record a problem to settle', async () => {
    const { result } = renderHookWithProviders(() => useIssueKinds())

    await waitForSuccess(result)
    expect(result.current.data?.map(({ kind }) => kind)).toEqual([
      'ambiguity_issue',
      'conflict',
      'validation_issue',
    ])
  })
})
