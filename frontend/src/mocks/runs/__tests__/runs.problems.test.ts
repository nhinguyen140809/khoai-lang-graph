import { describe, expect, it } from 'vitest'

import { HttpStatus } from '@/shared/api/http'
import { openPage } from '@/test/msw'

import { threadIds } from '../../shared/db'
import { refuseUnfinishedRun } from '../runs.problems'

describe('refuseUnfinishedRun', () => {
  it('refuses a thread that has a run that has not ended', () => {
    expect(refuseUnfinishedRun(threadIds.mentorMain)?.status).toBe(HttpStatus.Conflict)
  })

  it('accepts a thread whose runs have ended', () => {
    openPage('/?mock-run-status=done')

    expect(refuseUnfinishedRun(threadIds.mentorMain)).toBeNull()
  })
})
