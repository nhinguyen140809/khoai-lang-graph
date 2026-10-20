import { describe, expect, it } from 'vitest'

import { showsStage } from '../runs.utils'
import { showsStageCases } from './runs.utils.data'

describe('showsStage', () => {
  it.each(showsStageCases)('names the stage of a $status run: $shows', ({ status, shows }) => {
    expect(showsStage(status)).toBe(shows)
  })
})
