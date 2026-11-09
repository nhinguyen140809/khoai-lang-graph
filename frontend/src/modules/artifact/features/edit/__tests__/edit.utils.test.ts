import { describe, expect, it } from 'vitest'

import {
  artifactFixtureByKind,
  itemFixtureByKey,
} from '@/mocks/artifacts/fixtures/artifacts.fixtures'
import { projectIds } from '@/mocks/shared/db'

import { artifactUpdateBody, initialContent, itemUpdateBody } from '../edit.utils'
import { before, fields, initial } from './edit.utils.data'

const projectId = projectIds.mentor
const requirement = itemFixtureByKey(projectId, 'REQ-001')
const plan = artifactFixtureByKind(projectId, 'elicitation_plan')

describe('itemUpdateBody', () => {
  it('sends only the fields that changed, stored, without the empty entries', () => {
    expect(
      itemUpdateBody(
        fields,
        { content: before },
        {
          content: { ...before, title: 'Search mentors fast', acceptance_criteria: ['Given', ''] },
        },
      ),
    ).toEqual({ content: { title: 'Search mentors fast', acceptance_criteria: ['Given'] } })
  })

  it('sends a nullable field emptied as null', () => {
    expect(
      itemUpdateBody(fields, { content: before }, { content: { ...before, quality_category: '' } }),
    ).toEqual({
      content: { quality_category: null },
    })
  })

  it('sends nothing when no field changed', () => {
    expect(itemUpdateBody(fields, { content: before }, { content: before })).toEqual({})
  })
})

describe('artifactUpdateBody', () => {
  it('adds the title and the summary when they changed, and stores an empty summary as null', () => {
    expect(
      artifactUpdateBody(
        [],
        { title: 'Plan', summary: 'Old', content: {} },
        { title: 'New plan', summary: '', content: {} },
      ),
    ).toEqual({ title: 'New plan', summary: null })
    expect(
      artifactUpdateBody(
        [],
        { title: 'Plan', summary: null, content: {} },
        { title: 'Plan', summary: 'S', content: {} },
      ),
    ).toEqual({ summary: 'S' })
  })
})

describe('initialContent', () => {
  it('gives each field the record lacks its first value', () => {
    expect(initialContent(fields, {})).toEqual(initial)
  })
})

describe('the records of the fixtures', () => {
  it('keep the shapes the bodies are built from', () => {
    expect(requirement.content.statement).toBeDefined()
    expect(plan.content.objectives).toBeDefined()
  })
})
