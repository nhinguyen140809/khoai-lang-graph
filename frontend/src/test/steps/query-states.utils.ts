import { waitFor } from '@testing-library/react'
import { expect } from 'vitest'

/** Waits until the query of a rendered hook has loaded. */
export async function waitForSuccess(result: { current: { isSuccess: boolean } }) {
  await waitFor(() => {
    expect(result.current.isSuccess).toBe(true)
  })
}

/** Waits until every query that `read` gives has loaded; `read` is called again on each check. */
export async function waitForQueries(read: () => readonly { isSuccess: boolean }[]) {
  await waitFor(() => {
    expect(read().every(({ isSuccess }) => isSuccess)).toBe(true)
  })
}
