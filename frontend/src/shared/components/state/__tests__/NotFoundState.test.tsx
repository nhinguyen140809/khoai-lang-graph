import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { NotFoundState } from '../NotFoundState'
import { notFoundCases } from './NotFoundState.data'

describe('NotFoundState', () => {
  it.each(notFoundCases)('$name', ({ props: { action, ...props }, headings, shown, hidden }) => {
    render(
      <NotFoundState
        {...props}
        {...(action !== undefined && { action: <button type="button">{action}</button> })}
      />,
    )

    expect(screen.queryAllByRole('heading').map(({ textContent }) => textContent)).toEqual(headings)
    for (const text of shown) expect(screen.getByText(text)).toBeInTheDocument()
    for (const text of hidden) expect(screen.queryByText(text)).not.toBeInTheDocument()
  })
})
