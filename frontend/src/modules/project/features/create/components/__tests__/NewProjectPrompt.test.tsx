import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { renderWithProviders } from '@/test/render'
import { expectDisabled, pasteText, pressButton, pressKey, typeText } from '@/test/steps'

import { useProjectPromptStore } from '../../project-prompt.store'
import { NewProjectPrompt } from '../NewProjectPrompt'
import { blankIdeas, startCases } from './NewProjectPrompt.data'

function renderPrompt(onStart = vi.fn()) {
  renderWithProviders(<NewProjectPrompt onStart={onStart} />)
  const prompt = screen.getByRole('textbox', {
    name: 'What product do you want to write the requirements for?',
  })
  return { prompt, onStart }
}

describe('NewProjectPrompt', () => {
  it.each(startCases)('sends the idea with $by', async ({ by, idea, sent }) => {
    const { prompt, onStart } = renderPrompt()

    await userEvent.click(prompt)
    await pasteText(idea)
    if (by === 'Enter') await pressKey('Enter')
    else await pressButton('Create project')

    expect(onStart).toHaveBeenCalledExactlyOnceWith(sent)
  })

  it('adds a line with Shift+Enter', async () => {
    const { prompt, onStart } = renderPrompt()

    await typeText(prompt, 'Mentor{Shift>}{Enter}{/Shift}platform')

    expect(prompt).toHaveValue('Mentor\nplatform')
    expect(onStart).not.toHaveBeenCalled()
  })

  it.each(blankIdeas)('does not send the blank idea %j, nor offer to', async (idea) => {
    const { prompt, onStart } = renderPrompt()

    await userEvent.click(prompt)
    await pasteText(idea)
    await pressKey('Enter')

    expectDisabled('button', 'Create project')
    expect(onStart).not.toHaveBeenCalled()
  })

  it('takes the focus when a command asks for it', () => {
    const { prompt } = renderPrompt()
    expect(prompt).not.toHaveFocus()

    act(() => {
      useProjectPromptStore.getState().requestFocus()
    })

    expect(prompt).toHaveFocus()
    expect(useProjectPromptStore.getState().focusRequested).toBe(false)
  })

  it('takes the focus as it shows, when a command asked for it before', () => {
    useProjectPromptStore.setState({ focusRequested: true })

    expect(renderPrompt().prompt).toHaveFocus()
  })
})
