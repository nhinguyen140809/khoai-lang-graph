import { within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import {
  expectAlert,
  expectDisabled,
  expectEnabled,
  expectFocused,
  expectInvalidField,
  expectLabel,
  expectNoRole,
  expectNoText,
  expectRole,
  expectStillPending,
  expectText,
  expectValidField,
  waitForCall,
} from '../expectations.utils'

function renderForm() {
  document.body.innerHTML = `
    <form>
      <label>Name <input aria-invalid="true" /></label>
      <label>Email <input aria-invalid="false" /></label>
      <p role="alert">Enter a name.</p>
      <button type="button">Save</button>
      <button type="button" disabled>Send</button>
      <div role="status" aria-label="Sending"></div>
    </form>`
}

describe('the expectations', () => {
  it('pass for what is there', async () => {
    renderForm()

    await expectAlert('Enter a name.')
    await expectText('Enter a name.')
    await expectRole('button', 'Save')
    await expectRole('alert')
    expectInvalidField('Name')
    expectValidField('Email')
    expectNoText('Enter an email.')
    expectNoRole('dialog')
    expectNoRole('button', 'Cancel')
    await expectLabel('Sending')
    expectDisabled('button', 'Send')
    expectEnabled('button', 'Save')
    expectEnabled('button', 'Save', within(document.body))
  })

  it('check the focus of a control', () => {
    renderForm()
    document.querySelector('button')?.focus()

    expectFocused('button', 'Save')
    expect(() => {
      expectFocused('button', 'Send')
    }).toThrow()
  })

  it('fail for what is not there', () => {
    renderForm()

    expect(() => {
      expectNoText('Enter a name.')
    }).toThrow()
    expect(() => {
      expectNoRole('button', 'Save')
    }).toThrow()
    expect(() => {
      expectValidField('Name')
    }).toThrow()
    expect(() => {
      expectInvalidField('Email')
    }).toThrow()
    expect(() => {
      expectEnabled('button', 'Send')
    }).toThrow()
    expect(() => {
      expectDisabled('button', 'Save')
    }).toThrow()
  })

  it('see a call that has not answered, and fail for one that has', async () => {
    await expectStillPending(new Promise(() => undefined), 10)

    await expect(expectStillPending(Promise.resolve('done'), 10)).rejects.toThrow()
    await expect(expectStillPending(Promise.reject(new Error('failed')), 10)).rejects.toThrow()
  })

  it('wait until a mock was called, with the arguments given', async () => {
    const mock = vi.fn()
    setTimeout(() => {
      mock('a', 1)
    }, 10)

    await waitForCall(mock, 'a', 1)
    await waitForCall(mock)
  })
})
