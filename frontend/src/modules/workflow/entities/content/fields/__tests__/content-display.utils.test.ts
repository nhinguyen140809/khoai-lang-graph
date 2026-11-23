import { describe, expect, it } from 'vitest'

import {
  artifactKindFixtures,
  contentSchemaFixtureByKind,
} from '@/mocks/workflow/artifact-kinds.fixtures'

import {
  artifactDisplayOf,
  contentDisplayOf,
  documentDisplaysByKind,
  pageLayoutOf,
} from '../content-display.utils'
import { itemDisplays, itemPageLayouts } from '../content-fields.types'
import {
  displayCases,
  displayFallbackCases,
  messageSchema,
  profileSchema,
  transcriptSchema,
} from './content-fields.utils.data'

describe('contentDisplayOf', () => {
  it.each(displayCases)('reads the display of $kind', ({ kind, display }) => {
    expect(contentDisplayOf(contentSchemaFixtureByKind(kind))).toBe(display)
  })

  it.each(displayFallbackCases)('falls back for $name', ({ schema, display }) => {
    expect(contentDisplayOf(schema)).toBe(display)
  })
})

describe('documentDisplaysByKind', () => {
  const displays = documentDisplaysByKind(artifactKindFixtures)

  it('is the display of the first kind of item that holds content, past the sections', () => {
    expect(displays.get('persona_catalog')).toBe('profile')
    expect(displays.get('requirements_analysis')).toBe('table')
  })

  it('is the layout that the artifact kind names, when it is not a document', () => {
    expect(displays.get('interview_transcript')).toBe('transcript')
  })

  it('is a document alone for a kind that holds no item', () => {
    expect(displays.get('elicitation_plan')).toBe('document')
  })

  it('is empty before the kinds load', () => {
    expect(documentDisplaysByKind(undefined).size).toBe(0)
  })

  it('lets the layout that the artifact kind names win over the displays of its items', () => {
    const kinds = {
      workflow_version: 1,
      artifact_kinds: [
        {
          kind: 'interview',
          schema_version: 1,
          schema: transcriptSchema,
          item_kinds: [{ kind: 'message', schema_version: 1, schema: messageSchema }],
        },
      ],
    }

    expect(documentDisplaysByKind(kinds).get('interview')).toBe('transcript')
  })
})

describe('artifactDisplayOf', () => {
  it('reads the layout that an artifact kind names', () => {
    expect(artifactDisplayOf(transcriptSchema)).toBe('transcript')
  })

  it('reads an artifact that names a display of an item as a document', () => {
    expect(
      artifactDisplayOf({ title: 'Kind', 'x-level': 'artifact', 'x-ui-display': 'profile' }),
    ).toBe('document')
  })

  it('reads a document when the kind names no layout', () => {
    expect(artifactDisplayOf({ title: 'Kind', 'x-level': 'artifact' })).toBe('document')
  })
})

describe('pageLayoutOf', () => {
  it('gives a kind with the display profile the page layout of a profile', () => {
    expect(pageLayoutOf(profileSchema)).toBe('profile')
  })

  it('gives every other kind the page of today', () => {
    expect(pageLayoutOf(messageSchema)).toBe('fields')
    expect(pageLayoutOf(contentSchemaFixtureByKind('spec_requirement'))).toBe('fields')
  })

  it('has a row for every display of an item', () => {
    expect(Object.keys(itemPageLayouts).toSorted()).toEqual([...itemDisplays].toSorted())
  })
})

describe('the display of a test kind by level', () => {
  it('reads the display an item kind names', () => {
    expect(contentDisplayOf(profileSchema)).toBe('profile')
  })

  it('reads the layout an artifact kind names', () => {
    expect(contentDisplayOf(transcriptSchema)).toBe('transcript')
  })
})
