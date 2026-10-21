import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { server } from '@/mocks/msw-server.setup'
import { projectIds } from '@/mocks/shared/mock-ids.constants'
import { TestProviders } from '@/test/TestProviders'

import { RenameProjectDialog } from '../RenameProjectDialog'
import { renameProblemCases } from './RenameProjectDialog.data'

function renderDialog(name: string | null = 'Mentor platform') {
  const onOpenChange = vi.fn()
  render(
    <RenameProjectDialog
      project={{ id: projectIds.mentor, name }}
      open
      onOpenChange={onOpenChange}
    />,
    { wrapper: TestProviders },
  )
  return { onOpenChange, name: screen.getByRole<HTMLInputElement>('textbox', { name: 'Name' }) }
}

describe('RenameProjectDialog', () => {
  it('starts from the name, selected so that typing replaces it', async () => {
    const { name } = renderDialog()

    await vi.waitFor(() => {
      expect(name).toHaveFocus()
    })
    expect(name).toHaveValue('Mentor platform')
    expect([name.selectionStart, name.selectionEnd]).toEqual([0, 'Mentor platform'.length])
  })

  it('starts empty for a project that the agents have not named yet', () => {
    expect(renderDialog(null).name).toHaveValue('')
  })

  it('renames the project, then closes', async () => {
    const { name, onOpenChange } = renderDialog()

    await userEvent.clear(name)
    await userEvent.type(name, 'Mentor finder{Enter}')

    await vi.waitFor(() => {
      expect(onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it.each(renameProblemCases)(
    'says what is wrong with $name',
    async ({ typed, answer, problem }) => {
      if (answer !== null) server.use(answer())
      const { name, onOpenChange } = renderDialog()

      await userEvent.clear(name)
      await userEvent.type(name, `${typed}{Enter}`)

      expect(await screen.findByText(problem)).toBeInTheDocument()
      expect(onOpenChange).not.toHaveBeenCalled()
    },
  )
})
