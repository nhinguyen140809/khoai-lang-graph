import { waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { projectIds } from '@/mocks/shared/db'
import { renderHookWithProviders } from '@/test/render'

import { useOpenIssues } from '../useOpenIssues'

const projectId = projectIds.mentor

describe('useOpenIssues', () => {
  it('reads the open issues of the project with their subjects and their sides', async () => {
    const { result } = renderHookWithProviders(() => useOpenIssues(projectId))

    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    if (result.current.state !== 'success') throw new Error('The issues did not load')
    expect(result.current.count).toBeGreaterThan(0)

    const conflict = result.current.groups
      .find(({ kind }) => kind === 'conflict')
      ?.entries.find(({ subjects }) => subjects.length > 0)
    expect(conflict).toBeDefined()
    // A conflict carries its people on its involves links, which never name a subject.
    expect(conflict?.subjects.every(({ link }) => link.link_type !== 'involves')).toBe(true)

    // The words of a subject come from the link that ties it to its issue.
    const quoted = result.current.groups
      .flatMap(({ entries }) => entries.flatMap(({ subjects }) => subjects))
      .filter(({ link }) => link.target_quote !== null)
    expect(quoted.length).toBeGreaterThan(0)
  })
})
