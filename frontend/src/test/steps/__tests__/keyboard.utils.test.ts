import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { clickHolding, pasteText, pressKey, pressKeys, pressTab, typeText } from '../keyboard.utils'

function renderFields() {
  document.body.innerHTML = '<input aria-label="First" /><input aria-label="Second" />'
  const [first, second] = Array.from(document.querySelectorAll('input'))
  if (first === undefined || second === undefined) throw new Error('No field')
  return { first, second }
}

describe('the keyboard steps', () => {
  it('type text in a field', async () => {
    const { first } = renderFields()

    await typeText(first, 'Mentor')

    expect(first).toHaveValue('Mentor')
  })

  it('paste text into the field that has the focus', async () => {
    const { first } = renderFields()
    first.focus()

    await pasteText('An idea')

    expect(first).toHaveValue('An idea')
  })

  it('press a key, or keys with a modifier, on the focused element', async () => {
    const { first } = renderFields()
    first.focus()
    const keys: string[] = []
    first.addEventListener('keydown', (event) =>
      keys.push(`${event.shiftKey ? 'Shift+' : ''}${event.key}`),
    )

    await pressKey('Enter')
    await pressKeys('{Shift>}{ArrowUp}{/Shift}')

    expect(keys).toEqual(['Enter', 'Shift+Shift', 'Shift+ArrowUp'])
  })

  it('click an element while a key is held, then release it', async () => {
    const { first } = renderFields()
    const shifts: boolean[] = []
    first.addEventListener('click', (event) => shifts.push(event.shiftKey))

    await clickHolding('Shift', first)
    await userEvent.click(first)

    expect(shifts).toEqual([true, false])
  })

  it('move the focus to the next control with Tab', async () => {
    const { first, second } = renderFields()
    first.focus()
    const moved = vi.fn()
    second.addEventListener('focus', moved)

    await pressTab()

    expect(second).toHaveFocus()
    expect(moved).toHaveBeenCalledOnce()
  })
})
