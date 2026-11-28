import { describe } from 'vitest'

import { type DrawnThing, itDrawsEachOf } from '@/test/suites'

import * as icons from '..'

// The things the barrel exports that are not icons, a constant or a hook, are left out by name.
const drawnThings = Object.entries(icons).filter(
  ([name]) => name.endsWith('Icon') && name !== 'SpinningIcon',
) as readonly DrawnThing[]

describe('the icons that a clock draws', () => {
  itDrawsEachOf(drawnThings)
})
