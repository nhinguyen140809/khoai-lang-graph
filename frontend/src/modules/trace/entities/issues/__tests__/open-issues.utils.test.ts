import { describe, expect, it } from 'vitest'

import { openIssueEntries } from '../open-issues.utils'
import {
  closedAmbiguity,
  definitionIssueKinds,
  definitionLinkTypes,
  issueItems,
  issueLinks,
  kindTitles,
  librarian,
  openAmbiguity,
  openConflict,
  openValidation,
  requirement,
  student,
} from './open-issues.utils.data'

const entriesOf = () =>
  openIssueEntries(issueItems, issueLinks, {
    issueKinds: definitionIssueKinds,
    linkTypesOf: (kind) => definitionLinkTypes[kind] ?? { about: [], parties: [] },
    kindTitleOf: (kind) => kindTitles[kind] ?? kind,
    mainTextOf: (item) => {
      const description = item.content.description
      return typeof description === 'string' ? description : ''
    },
  })

describe('openIssueEntries', () => {
  it('groups the open issues by their kind in the order of the definition, with the title of the kind', () => {
    const groups = entriesOf()

    expect(groups.map(({ kind, kindTitle }) => ({ kind, kindTitle }))).toEqual([
      { kind: 'ambiguity_issue', kindTitle: 'Point to clarify' },
      { kind: 'conflict', kindTitle: 'Disagreement' },
      { kind: 'validation_issue', kindTitle: 'Problem to solve' },
    ])
  })

  it('leaves a closed issue out, and a kind with no open issue', () => {
    const groups = entriesOf()

    expect(groups.flatMap(({ entries }) => entries.map(({ issue }) => issue))).not.toContain(
      closedAmbiguity,
    )
  })

  it('gives each issue its problem text', () => {
    const [ambiguity] = entriesOf().find(({ kind }) => kind === 'ambiguity_issue')?.entries ?? []

    expect(ambiguity?.problem).toBe('The word fast has no number to it.')
  })

  it('gives the subjects of an issue through the links of its issue link types, with their quotes', () => {
    const groups = entriesOf()
    const ambiguity = groups
      .find(({ kind }) => kind === 'ambiguity_issue')
      ?.entries.find(({ issue }) => issue.id === openAmbiguity.id)
    const validation = groups
      .find(({ kind }) => kind === 'validation_issue')
      ?.entries.find(({ issue }) => issue.id === openValidation.id)

    expect(ambiguity?.subjects).toEqual([{ item: requirement, link: issueLinks[0] }])
    expect(validation?.subjects).toEqual([{ item: requirement, link: issueLinks[4] }])
    // A link to an item that the project does not hold names no subject.
    expect(ambiguity?.subjects).toHaveLength(1)
  })

  it('gives the sides of a conflict, the people its involves links name', () => {
    const conflict = entriesOf()
      .find(({ kind }) => kind === 'conflict')
      ?.entries.find(({ issue }) => issue.id === openConflict.id)

    expect(conflict?.sides).toEqual([student, librarian])
  })
})
