import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useFocusWhen } from '../useFocusWhen'

function addInput() {
  const input = document.createElement('input')
  document.body.append(input)
  return input
}

afterEach(() => {
  document.body.replaceChildren()
})

describe('useFocusWhen', () => {
  it('focuses the element once it is in the page', () => {
    const input = addInput()

    renderHook(() => {
      useFocusWhen({ current: input }, false)
    })

    expect(input).toHaveFocus()
  })

  it('focuses it again when it is asked to', () => {
    const input = addInput()
    const ref = { current: input }
    const { rerender } = renderHook(
      ({ isRequested }) => {
        useFocusWhen(ref, isRequested)
      },
      { initialProps: { isRequested: false } },
    )
    input.blur()

    rerender({ isRequested: true })

    expect(input).toHaveFocus()
  })
})
