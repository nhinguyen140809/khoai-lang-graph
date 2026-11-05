import { waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'
import { itToastsOnResult } from '@/test/suites'

import { editArtifactFormSchema } from '../../schemas/edit-artifact.schema'
import { useEditingRecordStore } from '../../stores/editing-record.store'
import { useUpdateArtifact } from '../useUpdateArtifact'

const artifact = artifactFixtureByKind(projectIds.mentor, 'requirements_analysis')

/** A form state that a save can show its problems at. */
function errorSetter() {
  return vi.fn()
}

describe('useUpdateArtifact', () => {
  it('sends the changed fields with If-Match, updates the cache and reloads, and ends the edit mode', async () => {
    const onChanged = vi.fn()
    useEditingRecordStore.getState().startEditing({ type: 'artifact', id: artifact.id })
    const { result } = renderHookWithProviders(() =>
      useUpdateArtifact(artifact, {
        setError: errorSetter(),
        schema: editArtifactFormSchema([]),
        onChanged,
      }),
    )

    result.current.mutate({ title: 'Requirements analysis of the interviews' })

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })
    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledOnce()
    })
    expect(useEditingRecordStore.getState().recordKey).toBeNull()
  })

  itToastsOnResult([
    {
      name: 'the saved artifact',
      start: async () => {
        const { result } = renderHookWithProviders(() =>
          useUpdateArtifact(artifact, {
            setError: errorSetter(),
            schema: editArtifactFormSchema([]),
            onChanged: () => undefined,
          }),
        )
        result.current.mutate({ title: 'Requirements analysis of the interviews' })
        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true)
        })
      },
      kind: 'success',
      message: 'Saved',
    },
  ])
})
