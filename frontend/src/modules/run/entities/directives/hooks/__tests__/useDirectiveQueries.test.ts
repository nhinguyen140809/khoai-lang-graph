import { describe, expect, it } from 'vitest'

import { runIds } from '@/mocks/shared/db'
import { pageItems } from '@/shared/api/query-client'
import { renderHookWithProviders } from '@/test/render'
import { waitForSuccess } from '@/test/steps'
import { itWaitsUntilEnabled } from '@/test/suites'

import { useRunDirectives } from '../useDirectiveQueries'

describe('useRunDirectives', () => {
  it('loads the directives of a run', async () => {
    const { result } = renderHookWithProviders(() => useRunDirectives(runIds.mentorMain1))

    await waitForSuccess(result)
    const directives = pageItems(result.current.data)
    expect(directives.map(({ kind }) => kind)).toEqual(['rework', 'intent'])
  })
})

describe('enabling', () => {
  itWaitsUntilEnabled([
    {
      name: 'useRunDirectives',
      useHook: () => useRunDirectives(runIds.mentorMain1, { isEnabled: false }),
    },
  ])
})
