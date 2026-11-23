import { describe, it } from 'vitest'

import { keepAttachedSources } from '@/modules/source/entities'
import { PromptBox, PromptInput, PromptTextarea } from '@/shared/components/prompt'
import { renderWithProviders } from '@/test/render'
import { expectNoText, expectRole, expectText, pressButton } from '@/test/steps'

import { AttachedSourcesTray } from '../components/AttachedSourcesTray'
import { AttachSourceMenu } from '../components/AttachSourceMenu'

function renderPrompt(files: File[]) {
  keepAttachedSources(files)
  renderWithProviders(
    <PromptInput
      value=""
      onValueChange={() => undefined}
      onSubmit={() => undefined}
      keysHint="Keys"
    >
      <PromptBox>
        <AttachedSourcesTray />
        <PromptTextarea placeholder="Idea" />
      </PromptBox>
      <AttachSourceMenu />
    </PromptInput>,
  )
}

describe('AttachedSourcesTray', () => {
  it('lists the files that the provider holds, and takes one off with its button', async () => {
    renderPrompt([new File(['x'], 'notes.md'), new File(['y'], 'brief.txt')])

    await expectText('notes.md')
    await pressButton('Remove notes.md')

    expectNoText('notes.md')
    await expectRole('listitem')
  })
})
