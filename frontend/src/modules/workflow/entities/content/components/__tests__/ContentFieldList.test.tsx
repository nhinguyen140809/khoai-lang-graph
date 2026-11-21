import { describe, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'
import { renderWithProviders } from '@/test/render'
import { expectText } from '@/test/steps'

import { ContentFieldList } from '../ContentFieldList'
import { field } from './ContentFieldValue.data'

describe('ContentFieldList', () => {
  it('shows each field under its title, with the value of its name', async () => {
    renderWithProviders(
      <ContentFieldList
        fields={[
          field({ name: 'summary', title: 'Summary' }),
          field({ name: 'detail', title: 'Detail' }),
        ]}
        content={{ summary: 'First line', detail: 'Second line' }}
        definition={workflowDefinitionFixture}
      />,
    )

    await expectText('Summary')
    await expectText('First line')
    await expectText('Detail')
    await expectText('Second line')
  })
})
