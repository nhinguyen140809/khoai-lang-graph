import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoText, expectText } from '@/test/steps'

import { NotFoundState } from '../NotFoundState'
import { notFoundCases } from './NotFoundState.data'

describe('NotFoundState', () => {
  it.each(notFoundCases)(
    '$name',
    async ({ props: { action, ...props }, headings, shown, hidden }) => {
      render(
        <NotFoundState
          {...props}
          {...(action !== undefined && { action: <button type="button">{action}</button> })}
        />,
      )

      expect(screen.queryAllByRole('heading').map(({ textContent }) => textContent)).toEqual(
        headings,
      )
      for (const text of shown) await expectText(text)
      for (const text of hidden) expectNoText(text)
    },
  )
})
