import { screen } from '@testing-library/react'
import { expect, type Mock, vi } from 'vitest'

import { isString } from '@/shared/lib/guards'
import { sleep } from '@/shared/lib/timing'

type Role = Parameters<typeof screen.findByRole>[0]
type Text = string | RegExp
/** Where a control is looked for: the screen, or a part of it given by `within`. */
type Scope = Pick<typeof screen, 'findByRole' | 'getByRole' | 'queryByRole'>

// What a test checks on the screen. A check that something is there waits for it to appear, and a
// check that something is not there looks once, so wait for what should go with `waitFor` first.

/** Waits until an alert shows this text, such as the error of a field or of a query. */
export async function expectAlert(text: Text) {
  expect(await screen.findByRole('alert')).toHaveTextContent(text)
}

/** Waits until this text shows. */
export async function expectText(text: Text) {
  expect(await screen.findByText(text)).toBeInTheDocument()
}

/** Checks that this text does not show. */
export function expectNoText(text: Text) {
  expect(screen.queryByText(text)).not.toBeInTheDocument()
}

/** Waits until a control of this role, and of this name when it is given, shows. */
export async function expectRole(role: Role, name?: Text, scope: Scope = screen) {
  expect(await scope.findByRole(role, name === undefined ? {} : { name })).toBeInTheDocument()
}

/** Checks that no control of this role, and of this name when it is given, shows. */
export function expectNoRole(role: Role, name?: Text, scope: Scope = screen) {
  expect(scope.queryByRole(role, name === undefined ? {} : { name })).not.toBeInTheDocument()
}

/** Waits until an element with this label shows, such as a spinner that is labelled. */
export async function expectLabel(label: Text) {
  expect(await screen.findByLabelText(label)).toBeInTheDocument()
}

function controlOf(scope: Scope, role: Role, name?: Text) {
  return scope.getByRole(role, name === undefined ? {} : { name })
}

/** Checks that a control of this role and name is disabled. */
export function expectDisabled(role: Role, name?: Text, scope: Scope = screen) {
  expect(controlOf(scope, role, name)).toBeDisabled()
}

/** Checks that a control of this role and name is enabled. */
export function expectEnabled(role: Role, name?: Text, scope: Scope = screen) {
  expect(controlOf(scope, role, name)).toBeEnabled()
}

/** Checks that a control of this role and name has the focus. */
export function expectFocused(role: Role, name?: Text, scope: Scope = screen) {
  expect(controlOf(scope, role, name)).toHaveFocus()
}

/** Checks that a link of this name goes to this address. */
export async function expectLink(name: Text, href: string, scope: Scope = screen) {
  expect(await scope.findByRole('link', { name })).toHaveAttribute('href', href)
}

/** Checks an attribute of a control of this role and name, such as `aria-pressed` or `aria-expanded`. */
export function expectAttribute(
  role: Role,
  name: Text,
  attribute: string,
  value: string,
  scope: Scope = screen,
) {
  expect(controlOf(scope, role, name)).toHaveAttribute(attribute, value)
}

/** Checks the value of a text field, given by its name. */
export function expectFieldValue(name: Text, value: string | number, scope: Scope = screen) {
  expect(controlOf(scope, 'textbox', name)).toHaveValue(value)
}

function fieldOf(field: string | HTMLElement) {
  return isString(field) ? screen.getByLabelText(field) : field
}

/** Checks that a field, given by its label or itself, is marked invalid. */
export function expectInvalidField(field: string | HTMLElement) {
  expect(fieldOf(field)).toHaveAttribute('aria-invalid', 'true')
}

/** Checks that a field, given by its label or itself, is not marked invalid. */
export function expectValidField(field: string | HTMLElement) {
  expect(fieldOf(field)).toHaveAttribute('aria-invalid', 'false')
}

/** Checks that a call has not answered after a short while, as in a loading scenario. */
export async function expectStillPending(call: Promise<unknown>, waitMs = 100) {
  const first = await Promise.race([
    call.then(
      () => 'answered',
      () => 'answered',
    ),
    sleep(waitMs).then(() => 'pending'),
  ])
  expect(first).toBe('pending')
}

/** Waits until a mock was called, with these arguments when they are given. */
export async function waitForCall(mock: Mock, ...args: unknown[]) {
  await vi.waitFor(() => {
    if (args.length === 0) expect(mock).toHaveBeenCalled()
    else expect(mock).toHaveBeenCalledWith(...args)
  })
}
