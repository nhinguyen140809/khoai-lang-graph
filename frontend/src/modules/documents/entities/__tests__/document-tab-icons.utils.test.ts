import { describe, expect, it } from 'vitest'

import { contentDisplays } from '@/modules/workflow/entities'

import { documentTabIconName, itemTabIconName } from '../utils/document-tab-icons.utils'

describe('documentTabIconName', () => {
  it('names the display of the document', () => {
    expect(documentTabIconName('cards', { isUnderReview: false })).toBe('documents.document.cards')
  })

  it('names a document alone while its parts are not known', () => {
    expect(documentTabIconName(undefined, { isUnderReview: false })).toBe(
      'documents.document.document',
    )
  })

  it('names the review that waits, whatever the display', () => {
    expect(documentTabIconName('table', { isUnderReview: true })).toBe('documents.review')
  })

  it('gives each display a name of its own', () => {
    const names = contentDisplays.map((display) =>
      documentTabIconName(display, { isUnderReview: false }),
    )

    expect(new Set(names).size).toBe(contentDisplays.length)
  })
})

describe('itemTabIconName', () => {
  it('names the display of the kind of the item', () => {
    expect(itemTabIconName('table')).toBe('documents.item.table')
  })

  it('names the plain item while its kind is not known', () => {
    expect(itemTabIconName(undefined)).toBe('documents.item.document')
  })
})
