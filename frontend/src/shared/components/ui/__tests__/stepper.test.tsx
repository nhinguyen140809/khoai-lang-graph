import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperTitle,
  StepperTrigger,
} from '../stepper'

function stepWith(props: Partial<Parameters<typeof StepperIndicator>[0]>) {
  return (
    <Stepper orientation="vertical" defaultValue={1}>
      <StepperItem step={1}>
        {/* The trigger names a panel only while one is on the page; here none is. */}
        <StepperTrigger aria-controls={undefined} id="planning-step">
          <StepperIndicator {...props}>1</StepperIndicator>
          <StepperTitle>Planning</StepperTitle>
          <StepperDescription>Done</StepperDescription>
        </StepperTrigger>
      </StepperItem>
    </Stepper>
  )
}

describe('StepperIndicator', () => {
  it('fills as installed by default', async () => {
    render(stepWith({}))

    const indicator = screen.getByText('1')
    expect(indicator.closest('[data-variant]')).toHaveAttribute('data-variant', 'solid')
    await expectNoAccessibilityViolations()
  })

  it('names the ghost variant, with no fill', () => {
    render(stepWith({ variant: 'ghost' }))

    const indicator = screen.getByText('1').closest('[data-variant]')
    expect(indicator).toHaveAttribute('data-variant', 'ghost')
    expect(indicator?.className).not.toContain('bg-accent')
  })

  it('names the color of what it holds', () => {
    render(stepWith({ variant: 'ghost', color: 'success' }))

    const indicator = screen.getByText('1').closest('[data-variant]')
    expect(indicator).toHaveAttribute('data-color', 'success')
    expect(screen.getByText('1')).toBeInTheDocument()
  })
})
