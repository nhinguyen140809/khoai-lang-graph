import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { itemFixtureByKey } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { contentSchemaFixtureByKind } from '@/mocks/workflow/artifact-kinds.fixtures'
import { updateItem } from '@/modules/artifact/entities'
import { contentFields } from '@/modules/workflow/entities'
import { renderWithProviders } from '@/test/render'
import {
  expectNoAccessibilityViolations,
  expectNoRole,
  expectNoText,
  expectText,
} from '@/test/steps'

import type { HistoryLevel, HistoryView } from '../../../revisions/revisions.types'
import { RevisionContent } from '../RevisionContent'

const projectId = projectIds.mentor
// AR-007 holds two versions in the mock data; AR-001 gains its second one from the edit of the
// test of the changes.
const twoVersions = itemFixtureByKey(projectId, 'AR-007')
const changed = itemFixtureByKey(projectId, 'AR-010')
const fields = contentFields(contentSchemaFixtureByKind('analyzed_requirement'))

/** A view of the history as the page holds it, which records what the content asks of it. */
function viewOf({
  level,
  selectedVersion,
  showsChanges,
}: {
  level: HistoryLevel
  selectedVersion: number
  showsChanges: boolean
}): HistoryView {
  return {
    level,
    selectedVersion,
    showsChanges,
    open: () => undefined,
    close: () => undefined,
    toggleList: () => undefined,
    stepBack: () => undefined,
    select: () => undefined,
    setShowsChanges: () => undefined,
  }
}

function renderContent(
  view: HistoryView,
  target: { type: 'item'; id: string } = { type: 'item', id: twoVersions.id },
) {
  return renderWithProviders(<RevisionContent target={target} view={view} fields={fields} />)
}

describe('RevisionContent', () => {
  it('renders nothing while the surface is closed', () => {
    const { container } = renderContent(
      viewOf({ level: 'closed', selectedVersion: 2, showsChanges: false }),
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the fields of the selected version, without a banner', async () => {
    renderContent(viewOf({ level: 'version', selectedVersion: 2, showsChanges: false }))

    expect(
      await screen.findByText(
        'A booking runs in two layers: a request, then the approval of the mentor or the admin.',
      ),
    ).toBeInTheDocument()
    expectNoText(/Version 2 of 2/)
    expectNoRole('button', 'Close the history')
  })

  it('marks the fields that a version changed, and reads one without a change as it is', async () => {
    // One field changes, one is emptied, and the rest stay: version 2 of AR-010 after an edit.
    await updateItem(changed.id, changed.version, {
      content: { title: 'List the search results fast', quality_category: null },
    })
    renderContent(viewOf({ level: 'version', selectedVersion: 2, showsChanges: true }), {
      type: 'item',
      id: changed.id,
    })

    await expectText('Changed')
    await expectText(/search results fast/)
    await expectText(/search result is listed/)
    await expectText('Students leave a slow page.')
  })

  it('says that a version without a change of content did not change', async () => {
    // A save that holds the same content makes a version that changed nothing.
    const unchanged = itemFixtureByKey(projectId, 'AR-007')
    await updateItem(unchanged.id, unchanged.version, { content: unchanged.content })
    renderContent(viewOf({ level: 'list', selectedVersion: 3, showsChanges: true }), {
      type: 'item',
      id: unchanged.id,
    })

    await expectText('The content did not change.')
  })

  it('has no accessibility violation', async () => {
    const { container } = renderContent(
      viewOf({ level: 'version', selectedVersion: 2, showsChanges: false }),
    )
    await expectText(/two layers/)

    await expectNoAccessibilityViolations(container)
  })
})
