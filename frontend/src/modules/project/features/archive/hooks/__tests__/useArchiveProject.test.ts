import { act, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { describe, expect, it } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { apiEndpoints } from '@/shared/api/endpoints'
import { HttpMethod } from '@/shared/api/http'
import { isRecord } from '@/shared/lib/guards'
import { serverErrorOn } from '@/test/msw'
import { renderHookWithProviders } from '@/test/render'
import { spyOnToast } from '@/test/steps'
import { itToastsOnResult } from '@/test/suites'

import { useArchiveProject } from '../useArchiveProject'
import { archiveErrorCases, archiveToastCases, mentorProject } from './useArchiveProject.data'

type ToastAction = Extract<
  NonNullable<NonNullable<Parameters<typeof toast.success>[1]>['action']>,
  { onClick: unknown }
>

// The hook ignores the event of the click, so a test passes none.
const clickOnUndo = undefined as never

function isUndo(action: unknown): action is ToastAction {
  return isRecord(action) && typeof action.onClick === 'function'
}

/** Renders the hook and archives or restores the project of the cases. */
function startChange(change: 'archive' | 'restore') {
  const { result } = renderHookWithProviders(() => useArchiveProject())
  act(() => {
    result.current[change](mentorProject)
  })
}

describe('useArchiveProject', () => {
  itToastsOnResult([
    ...archiveToastCases.map(({ name, change, message, duration }) => ({
      name,
      start: () => {
        startChange(change)
      },
      kind: 'success' as const,
      message,
      options: { description: mentorProject.name, ...(duration !== undefined && { duration }) },
    })),
    ...archiveErrorCases.map(({ name, change, message }) => ({
      name,
      start: () => {
        startChange(change)
      },
      refuse: () => {
        server.use(serverErrorOn(HttpMethod.Patch, apiEndpoints.project.pattern))
      },
      kind: 'error' as const,
      message,
    })),
  ])

  it('restores the project when Undo is chosen on the toast of an archive', async () => {
    const success = spyOnToast('success')
    const { result } = renderHookWithProviders(() => useArchiveProject())
    act(() => {
      result.current.archive(mentorProject)
    })
    await waitFor(() => {
      expect(success).toHaveBeenCalledOnce()
    })
    const [, options] = success.mock.calls[0] ?? []

    const action = options?.action
    if (!isUndo(action)) throw new Error('The toast offers no Undo.')

    act(() => {
      action.onClick(clickOnUndo)
    })

    await waitFor(() => {
      expect(success).toHaveBeenCalledTimes(2)
    })
    expect(success.mock.calls[1]?.[0]).toBe('Project restored')
  })
})
