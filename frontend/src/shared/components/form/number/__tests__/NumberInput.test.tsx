import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type ComponentProps, useState } from 'react'
import { describe, expect, it, vi } from 'vitest'

import {
  clickHolding,
  expectDisabled,
  expectEnabled,
  expectFocused,
  pasteText,
  pressButton,
  pressKey,
  pressKeys,
  pressTab,
  typeText,
} from '@/test/steps'

import { NumberInput } from '../NumberInput'
import {
  blurCases,
  keyCases,
  numberLineStepCases,
  numberLineTypedCases,
  typedCases,
} from './NumberInput.data'

type NumberInputTestProps = Partial<
  Omit<ComponentProps<typeof NumberInput>, 'value' | 'onValueChange'>
>

interface HarnessProps {
  initial?: number | null
  props?: NumberInputTestProps
  onReport?: (value: number | null) => void
}

/** Holds the number as a form does, and tells every number the input reports. */
function Harness({ initial = null, props, onReport }: HarnessProps) {
  const [value, setValue] = useState<number | null>(initial)
  return (
    <>
      <NumberInput
        aria-label="Count"
        {...props}
        value={value}
        onValueChange={(next) => {
          setValue(next)
          onReport?.(next)
        }}
      />
      <button
        type="button"
        onClick={() => {
          setValue(9)
        }}
      >
        Set 9
      </button>
    </>
  )
}

function lastOf(report: ReturnType<typeof vi.fn>): unknown {
  return report.mock.lastCall?.[0]
}

const input = () => screen.getByRole('spinbutton', { name: 'Count' })

describe('NumberInput', () => {
  it('is a spinbutton that tells its value and its limits', () => {
    render(<Harness initial={3} props={{ min: 1, max: 9 }} />)

    expect(input()).toHaveValue('3')
    expect(input()).toHaveAttribute('aria-valuenow', '3')
    expect(input()).toHaveAttribute('aria-valuemin', '1')
    expect(input()).toHaveAttribute('aria-valuemax', '9')
  })

  it.each([
    { integer: true, mode: 'numeric' },
    { integer: false, mode: 'decimal' },
  ])('asks for a $mode keyboard when integer is $integer', ({ integer, mode }) => {
    render(<Harness props={{ integer }} />)

    expect(input()).toHaveAttribute('inputmode', mode)
  })

  it.each(typedCases)('keeps $text and reports it when $name are typed', async (testCase) => {
    const report = vi.fn()
    render(<Harness props={testCase.props} onReport={report} />)

    await typeText(input(), testCase.typed)

    expect(input()).toHaveValue(testCase.text)
    expect(lastOf(report)).toBe(testCase.reported)
  })

  it('reports null when the input is emptied', async () => {
    const report = vi.fn()
    render(<Harness initial={5} onReport={report} />)

    await userEvent.clear(input())

    expect(lastOf(report)).toBeNull()
  })

  it('keeps only the whole part of a pasted decimal when the number is whole', async () => {
    const report = vi.fn()
    render(<Harness props={{ integer: true }} onReport={report} />)

    await userEvent.click(input())
    await pasteText('12.5')

    expect(input()).toHaveValue('12')
    expect(lastOf(report)).toBe(12)
  })

  it.each(keyCases)('reports $reported for $name', async (testCase) => {
    const report = vi.fn()
    render(<Harness initial={Number(testCase.start)} props={testCase.props} onReport={report} />)

    await userEvent.click(input())
    await pressKeys(testCase.key)

    expect(lastOf(report)).toBe(testCase.reported)
    expect(input()).toHaveValue(String(testCase.reported))
  })

  describe('across the number line', () => {
    it.each(numberLineTypedCases)(
      'shows $text and reports $reported for $name typed as $typed',
      async ({ props, typed, text, reported }) => {
        const report = vi.fn()
        render(<Harness props={props} onReport={report} />)

        await typeText(input(), typed)

        expect(input()).toHaveValue(text)
        expect(lastOf(report)).toBe(reported)
      },
    )

    it.each(numberLineStepCases)(
      'leads $name from $from to $to',
      async ({ props, from, keys, to }) => {
        const report = vi.fn()
        render(<Harness initial={from} props={props} onReport={report} />)

        await userEvent.click(input())
        await pressKeys(keys)

        expect(lastOf(report)).toBe(to)
        expect(input()).toHaveValue(String(to))
      },
    )
  })

  it('starts at zero from an empty input', async () => {
    const report = vi.fn()
    render(<Harness onReport={report} />)

    await userEvent.click(input())
    await pressKey('ArrowUp')

    expect(lastOf(report)).toBe(0)
  })

  it.each(blurCases)('writes $text when the input with $name loses the focus', async (testCase) => {
    render(<Harness props={testCase.props} />)

    await typeText(input(), testCase.typed)
    await pressTab()

    expect(input()).toHaveValue(testCase.text)
  })

  it('steps with the arrows and keeps the focus in the input', async () => {
    const report = vi.fn()
    render(<Harness initial={5} onReport={report} />)

    await userEvent.click(input())
    await pressButton('Increase')
    await pressButton('Decrease')
    await pressButton('Decrease')

    expect(report.mock.calls).toEqual([[6], [5], [4]])
    expect(input()).toHaveFocus()
  })

  it('steps ten times with Shift held on an arrow', async () => {
    const report = vi.fn()
    render(<Harness initial={5} onReport={report} />)

    await clickHolding('Shift', screen.getByRole('button', { name: 'Increase' }))

    expect(lastOf(report)).toBe(15)
  })

  it('leaves the arrows out of the tab order', async () => {
    render(<Harness />)

    await pressTab()
    expect(input()).toHaveFocus()
    await pressTab()

    expectFocused('button', 'Set 9')
  })

  it('disables the arrow that would pass a limit', () => {
    render(<Harness initial={10} props={{ min: 0, max: 10 }} />)

    expectDisabled('button', 'Increase')
    expectEnabled('button', 'Decrease')
  })

  it.each([{ disabled: true }, { readOnly: true }])('does not step when %j', async (lock) => {
    const report = vi.fn()
    render(<Harness initial={5} props={lock} onReport={report} />)

    expectDisabled('button', 'Increase')
    expectDisabled('button', 'Decrease')
    input().focus()
    await pressKey('ArrowUp')

    expect(report).not.toHaveBeenCalled()
  })

  it('shows a value that changes from outside', async () => {
    render(<Harness initial={5} />)

    await pressButton('Set 9')

    expect(input()).toHaveValue('9')
  })

  it('keeps the text on the way to a number when the value it reports comes back', async () => {
    render(<Harness />)

    await typeText(input(), '1.')

    expect(input()).toHaveValue('1.')
  })

  it('tells the owner that the input lost the focus', async () => {
    const onBlur = vi.fn()
    render(<Harness props={{ onBlur }} />)

    await userEvent.click(input())
    await pressTab()

    expect(onBlur).toHaveBeenCalledTimes(1)
  })
})
