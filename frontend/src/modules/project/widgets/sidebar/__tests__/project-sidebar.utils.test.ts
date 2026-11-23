import { describe, expect, it } from 'vitest'

import { noticeableRunStatus, projectsByAttention } from '../project-sidebar.utils'
import { attentionCases, noticeableCases } from './project-sidebar.utils.data'

describe('projectsByAttention', () => {
  it.each(attentionCases)('puts $name in order', ({ projects, order }) => {
    expect(projectsByAttention(projects).map(({ id }) => id)).toEqual(order)
  })

  it('leaves the list it is given as it was', () => {
    const projects = attentionCases[1]?.projects ?? []
    const before = projects.map(({ id }) => id)

    projectsByAttention(projects)

    expect(projects.map(({ id }) => id)).toEqual(before)
  })
})

describe('noticeableRunStatus', () => {
  it.each(noticeableCases)('shows $shown for $status', ({ status, shown }) => {
    expect(noticeableRunStatus(status)).toBe(shown)
  })
})
