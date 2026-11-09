import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { renderWithProviders } from '@/test/render'

import { RecordName, RecordNameTooltip } from '../record-name'

describe('RecordName', () => {
  it('reads the kind, the title and the key on one line, the key last', () => {
    renderWithProviders(
      <RecordName
        kind="Analyzed requirement"
        title="Layered booking flow"
        code="AR-003"
        layout="line"
      />,
    )

    const title = screen.getByText('Layered booking flow')
    const name = title.parentElement
    if (name === null) throw new Error('The name lost its line')
    expect(name).toHaveTextContent('Analyzed requirement')
    // The key reads last, after the kind and the title.
    const text = name.textContent ?? ''
    expect(text.indexOf('AR-003')).toBeGreaterThan(text.indexOf('Layered booking flow'))
  })

  it('leaves the key out when the kind and the title say which record it is', () => {
    renderWithProviders(<RecordName kind="Persona" title="Minh" layout="line" />)

    expect(screen.getByText('Minh')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="key-text"]')).not.toBeInTheDocument()
  })

  it('stacks the kind over the title, with the key at the end of its line', () => {
    renderWithProviders(
      <RecordName
        kind="Analyzed requirement"
        title="Layered booking flow"
        code="AR-003"
        layout="stacked"
      />,
    )

    const kind = screen.getByText('Analyzed requirement')
    const title = screen.getByText('Layered booking flow')
    expect(kind.compareDocumentPosition(title)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
    expect(title.parentElement).toHaveTextContent('AR-003')
  })
})

describe('RecordNameTooltip', () => {
  it('holds the kind, the title and the key of the record over its drawn title', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecordNameTooltip kind="Analyzed requirement" title="Layered booking flow" code="AR-003">
        <a href="#ar-003">Layered booking flow</a>
      </RecordNameTooltip>,
    )

    await user.hover(screen.getByRole('link', { name: 'Layered booking flow' }))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Analyzed requirement')
    expect(tooltip).toHaveTextContent('Layered booking flow')
    expect(tooltip).toHaveTextContent('AR-003')
  })

  it('holds the kind and the title alone when no key helps', async () => {
    const user = userEvent.setup()
    renderWithProviders(
      <RecordNameTooltip kind="Persona" title="Minh">
        <a href="#minh">Minh</a>
      </RecordNameTooltip>,
    )

    await user.hover(screen.getByRole('link', { name: 'Minh' }))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveTextContent('Persona')
    expect(tooltip).not.toHaveTextContent('key')
  })
})
