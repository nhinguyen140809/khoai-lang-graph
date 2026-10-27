import { describe, expect, it } from 'vitest'

import { routerMock } from '@/test/next-stubs'

import { expectPushedTo, expectReplacedWith } from '../router-expectations.utils'

describe('the router expectations', () => {
  it('wait until the page is pushed to an address', async () => {
    setTimeout(() => {
      routerMock.push('/projects')
    }, 10)

    await expectPushedTo('/projects')
  })

  it('wait until the address is replaced, with its options', async () => {
    routerMock.replace('/projects?status=closed', { scroll: false })

    await expectReplacedWith('/projects?status=closed', { scroll: false })
    await expect(expectReplacedWith('/other')).rejects.toThrow()
  })
})
