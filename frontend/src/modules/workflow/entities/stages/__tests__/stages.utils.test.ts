import { describe, expect, it } from 'vitest'

import { workflowDefinitionFixture } from '@/mocks/workflow/workflow.fixtures'

import { stageTitles, subjectKindByStage, visibleStages, visibleStageTitle } from '../stages.utils'
import { expectedVisibleStages, nestedStages, visibleTitleCases } from './stages.utils.data'

describe('stageTitles', () => {
  it('maps the key of each stage to its title', () => {
    const titles = stageTitles(workflowDefinitionFixture)

    expect(titles.size).toBe(workflowDefinitionFixture.stages.length)
    expect(titles.get('analysis_review')).toBe('Reviewing the analysis')
  })
})

describe('visibleStages', () => {
  it('nests the stages by parent and leaves out the internal ones with their children', () => {
    expect(visibleStages({ ...workflowDefinitionFixture, stages: nestedStages })).toEqual(
      expectedVisibleStages,
    )
  })

  it('lists the stages of version 1 flat, without the internal one', () => {
    const keys = visibleStages(workflowDefinitionFixture).map(({ key }) => key)

    expect(keys).not.toContain('intent_routing')
    expect(keys).toHaveLength(workflowDefinitionFixture.stages.length - 1)
  })
})

describe('visibleStageTitle', () => {
  it.each(visibleTitleCases)('gives the title for $name', ({ stage, title }) => {
    const definition = { ...workflowDefinitionFixture, stages: nestedStages }

    expect(visibleStageTitle(definition, stage)).toBe(title)
  })

  it('gives no title for the first stage of version 1, which is internal', () => {
    expect(visibleStageTitle(workflowDefinitionFixture, 'intent_routing')).toBeNull()
  })
})

describe('subjectKindByStage', () => {
  it('gives the subject item kind of each stage that runs once for each subject', () => {
    const subjectsOfStage = subjectKindByStage(workflowDefinitionFixture)

    expect(subjectsOfStage.get('interviewing')).toBe('persona')
    // A kind with one artifact for the project gives its stage no subject.
    expect(subjectsOfStage.has('planning')).toBe(false)
  })
})
