import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoAccessibilityViolations } from '@/test/steps'

import { Button } from '../button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../dialog'

function dialogWith(size?: 'md' | 'lg' | 'xl', scrollBody?: boolean) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent {...(size !== undefined && { size })} {...(scrollBody && { scrollBody })}>
        <DialogHeader>
          <DialogTitle>The title</DialogTitle>
        </DialogHeader>
        <p>The body</p>
      </DialogContent>
    </Dialog>
  )
}

describe('DialogContent', () => {
  it.each([
    { name: 'the installed default', size: undefined, data: 'sm' },
    { name: 'md', size: 'md' as const, data: 'md' },
    { name: 'lg', size: 'lg' as const, data: 'lg' },
    { name: 'xl', size: 'xl' as const, data: 'xl' },
  ])('names its width, $name', async ({ size, data }) => {
    render(dialogWith(size))
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('data-size', data)
    await expectNoAccessibilityViolations()
  })

  it('scrolls its body when asked', async () => {
    render(dialogWith(undefined, true))
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    expect(await screen.findByRole('dialog')).toHaveAttribute('data-scroll-body', 'true')
  })

  it('keeps the fill of the install without the props', async () => {
    render(dialogWith())
    await userEvent.click(screen.getByRole('button', { name: 'Open' }))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('data-scroll-body', 'false')
    expect(dialog.className).toContain('sm:max-w-sm')
  })
})
