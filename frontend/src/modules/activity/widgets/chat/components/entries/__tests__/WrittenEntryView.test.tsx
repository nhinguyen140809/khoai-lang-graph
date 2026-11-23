import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { buildRun } from '@/mocks/runs/fixtures/runs.fixtures'
import { projectIds, runIds, threadIds } from '@/mocks/shared/db'
import type { KindGroup } from '@/modules/activity/entities'
import { renderWithProviders } from '@/test/render'
import { expectText } from '@/test/steps'

import { RunActivityProvider } from '../RunActivityContext'
import { WrittenEntryView } from '../WrittenEntryView'

const run = buildRun({
  id: runIds.mentorMain3,
  thread_id: threadIds.mentorMain,
  project_id: projectIds.mentor,
  number: 1,
})

const reference = (index: number, kind: string) => ({
  item_id: `i${String(index)}`,
  kind,
  key: `K-${String(index)}`,
  version: 1,
})

function group(kind: string, title: string, count: number, isNavigable: boolean): KindGroup {
  return {
    kind,
    title,
    isNavigable,
    created: Array.from({ length: count }, (_, index) => reference(index, kind)),
    changed: [],
  }
}

function renderGroups(groups: KindGroup[]) {
  return renderWithProviders(
    <RunActivityProvider value={{ run, thread: null, projectId: projectIds.mentor }}>
      <WrittenEntryView kindGroups={groups} />
    </RunActivityProvider>,
  )
}

describe('WrittenEntryView', () => {
  it('lists the items of a kind that has pages, a row for each', async () => {
    renderGroups([group('persona', 'Persona', 2, true)])

    await expectText('Persona: 2 written')
    expect(await screen.findAllByRole('button')).toHaveLength(2)
  })

  it('only counts the items of a kind that has no pages', async () => {
    renderGroups([group('interview_message', 'Interview message', 18, false)])

    await expectText('Interview message: 18 written')
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })
})
