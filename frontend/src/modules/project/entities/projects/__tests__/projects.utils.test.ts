import { describe, expect, it } from 'vitest'

import {
  emptyProjectListMessage,
  hasNews,
  projectName,
  projectsMatching,
  unfinishedRunCount,
} from '../projects.utils'
import {
  emptyCases,
  hasNewsCases,
  projectNameCases,
  searchCases,
  unfinishedRunCountCases,
} from './projects.utils.data'

describe('projectName', () => {
  it.each(projectNameCases)('shows $name', ({ project, shown }) => {
    expect(projectName(project)).toBe(shown)
  })
})

describe('unfinishedRunCount', () => {
  it.each(unfinishedRunCountCases)('counts $name', ({ counts, count }) => {
    expect(unfinishedRunCount({ unfinished_run_counts: counts })).toBe(count)
  })
})

describe('projectsMatching', () => {
  it.each(searchCases)('keeps $name', ({ projects, search, ids }) => {
    expect(projectsMatching(projects, search).map(({ id }) => id)).toEqual(ids)
  })
})

describe('emptyProjectListMessage', () => {
  it.each(emptyCases)(
    'says $text for the $status projects and the search "$search"',
    ({ status, search, text }) => {
      expect(emptyProjectListMessage(status, search)).toBe(text)
    },
  )
})

describe('hasNews', () => {
  it.each(hasNewsCases)('is $news for $name', ({ seenAt, activityAt, news }) => {
    expect(hasNews(seenAt, activityAt)).toBe(news)
  })
})
