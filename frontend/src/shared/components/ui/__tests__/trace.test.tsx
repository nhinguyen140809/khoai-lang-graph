import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { Trace, TraceIcon, TraceLine, TraceTitle } from '../trace'

describe('TraceLine', () => {
  it('keeps its color out when none is given', async () => {
    render(
      <Trace>
        <TraceLine>
          <TraceIcon>+</TraceIcon>
          <TraceTitle>Analysing the interviews</TraceTitle>
        </TraceLine>
      </Trace>,
    )

    const line = screen.getByText('Analysing the interviews').closest('[data-slot="trace-line"]')
    expect(line).not.toHaveAttribute('data-color')
    await expectNoAccessibilityViolations()
  })

  it('names the color of the line and colors its icon', () => {
    render(
      <Trace>
        <TraceLine color="primary" status="running">
          <TraceIcon>*</TraceIcon>
          <TraceTitle>Interviewing</TraceTitle>
        </TraceLine>
      </Trace>,
    )

    const line = screen.getByText('Interviewing').closest('[data-slot="trace-line"]')
    expect(line).toHaveAttribute('data-color', 'primary')
    expect(line).toHaveAttribute('data-status', 'running')
  })
})
