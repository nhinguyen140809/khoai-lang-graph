import { fireEvent, render } from '@testing-library/react'
import { createElement } from 'react'
import { describe, expect, it } from 'vitest'

import { defaultAssetView } from '../../asset.constants'
import { useTurnableView } from '../useTurnableView'

/** A box that the hook fills in, so that the test can press and drag on it, reading the view it holds. */
function Probe() {
  const { view, dragProps } = useTurnableView(defaultAssetView)
  return createElement('div', {
    'data-testid': 'box',
    'data-view': `${String(view.yaw)} ${String(view.pitch)}`,
    ...dragProps,
  })
}

const viewOf = (box: HTMLElement) => box.getAttribute('data-view')

describe('useTurnableView', () => {
  it('starts at the view it is given', () => {
    const { getByTestId } = render(createElement(Probe))
    expect(viewOf(getByTestId('box'))).toBe(
      `${String(defaultAssetView.yaw)} ${String(defaultAssetView.pitch)}`,
    )
  })

  it('turns the view as the pointer drags over it, and goes on turning over one drag', () => {
    const { getByTestId } = render(createElement(Probe))
    const box = getByTestId('box')

    fireEvent.pointerDown(box, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 140, clientY: 120 })
    expect(viewOf(box)).toBe('-5 50')

    fireEvent.pointerMove(box, { pointerId: 1, clientX: 160, clientY: 120 })
    expect(viewOf(box)).toBe('10 50')
  })

  it('turns no more once the pointer lets go', () => {
    const { getByTestId } = render(createElement(Probe))
    const box = getByTestId('box')

    fireEvent.pointerDown(box, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 140, clientY: 120 })
    fireEvent.pointerUp(box, { pointerId: 1 })
    fireEvent.pointerMove(box, { pointerId: 1, clientX: 200, clientY: 200 })
    expect(viewOf(box)).toBe('-5 50')
  })

  it('ignores a pointer that is not the one that pressed it', () => {
    const { getByTestId } = render(createElement(Probe))
    const box = getByTestId('box')

    fireEvent.pointerDown(box, { button: 0, pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(box, { pointerId: 2, clientX: 300, clientY: 300 })
    expect(viewOf(box)).toBe(`${String(defaultAssetView.yaw)} ${String(defaultAssetView.pitch)}`)
  })
})
