import { act, renderHook, waitFor } from '@testing-library/react'
import { toast } from 'sonner'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { TestProviders } from '@/test/TestProviders'

import { useArchiveProject } from '../useArchiveProject'
import { archiveToastCases, mentorProject } from './useArchiveProject.data'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useArchiveProject', () => {
  it.each(archiveToastCases)('shows the toast of $name', async ({ change, message, duration }) => {
    const success = vi.spyOn(toast, 'success')
    const { result } = renderHook(() => useArchiveProject(), { wrapper: TestProviders })

    act(() => {
      result.current[change](mentorProject)
    })

    await waitFor(() => {
      expect(success).toHaveBeenCalledOnce()
    })
    const [shown, options] = success.mock.calls[0] ?? []
    expect(shown).toBe(message)
    expect(options?.description).toBe(mentorProject.name)
    expect(options?.duration).toBe(duration)
  })
})
