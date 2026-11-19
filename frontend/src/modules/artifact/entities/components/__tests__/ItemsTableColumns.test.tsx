import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { artifactFixtureByKind } from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'
import { assertPresent } from '@/shared/lib/guards'
import { renderWithProviders } from '@/test/render'

import { useArtifactDocument } from '../../outline/hooks/useArtifactDocument'
import { ArtifactDocument } from '../ArtifactDocument'

function LoadedDocument({ artifactId }: { artifactId: string }) {
  const document = useArtifactDocument(artifactId)
  return document.state === 'success' ? (
    <ArtifactDocument
      data={document}
      renderItemLink={(item, title) => <a href={`/items/${item.key}`}>{title}</a>}
      isUnderReview={false}
      renderItemIdLink={(itemId, children) => <a href={`/participants/${itemId}`}>{children}</a>}
    />
  ) : null
}

describe('the table of the items of a document', () => {
  it('reads the title first, then the fields, and the key last', async () => {
    renderWithProviders(
      <LoadedDocument
        artifactId={artifactFixtureByKind(projectIds.mentor, 'requirements_analysis').id}
      />,
    )

    const [table] = await screen.findAllByRole('table')
    const headers = within(assertPresent(table, 'The document has no table')).getAllByRole(
      'columnheader',
    )

    expect(headers.map((header) => header.textContent)).toEqual(['Title', 'Topic', 'Key'])
  })
})
