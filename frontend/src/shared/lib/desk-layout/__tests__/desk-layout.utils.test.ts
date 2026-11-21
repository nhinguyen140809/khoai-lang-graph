import { afterEach, describe, expect, it, vi } from 'vitest'

// The environment is read once, when its module loads, so each test sets it and loads the module again.
async function loadUtils(layout?: string) {
  vi.resetModules()
  if (layout !== undefined) vi.stubEnv('NEXT_PUBLIC_DESK_LAYOUT', layout)
  return import('../desk-layout.utils')
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('resolveDeskLayout', () => {
  it('gives the library when the environment names none', async () => {
    const { resolveDeskLayout } = await loadUtils()

    expect(resolveDeskLayout()).toBe('library')
  })

  it('gives the arrangement that the environment names', async () => {
    const { resolveDeskLayout } = await loadUtils('studio')

    expect(resolveDeskLayout()).toBe('studio')
  })
})

describe('byDeskLayout', () => {
  const values = { library: 'side list', studio: 'rail' }

  it('gives the value of the library by default', async () => {
    const { byDeskLayout } = await loadUtils()

    expect(byDeskLayout(values)).toBe('side list')
  })

  it('gives the value of the arrangement that the environment names', async () => {
    const { byDeskLayout } = await loadUtils('studio')

    expect(byDeskLayout(values)).toBe('rail')
  })
})
