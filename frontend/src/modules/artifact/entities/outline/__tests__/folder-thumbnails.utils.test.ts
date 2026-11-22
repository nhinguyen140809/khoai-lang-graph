import { describe, expect, it } from 'vitest'

import {
  folderThumbnails,
  isFolder,
  overviewTitle,
  rootThumbnails,
} from '../folder-thumbnails.utils'
import { artifactOutline, isBranch, outlinePath } from '../outline.utils'
import { issueKindFixtures, kindViewFixtures, mentorDocument } from './outline.utils.data'

function outlineOf(kind: string) {
  const { artifact, items, itemKinds } = mentorDocument(kind)
  return artifactOutline({
    artifact,
    artifactSchema: kindViewFixtures.get(kind)?.schema,
    issueKinds: issueKindFixtures,
    items,
    kinds: kindViewFixtures,
    itemKinds,
  })
}

describe('folderThumbnails', () => {
  it('makes a folder of a section or a group that holds items, colored by its title', () => {
    const nodes = outlineOf('requirements_analysis')
    const thumbnails = folderThumbnails(nodes, kindViewFixtures)
    const folders = thumbnails.filter(({ look }) => look === 'folder')

    expect(folders.length).toBeGreaterThan(0)
    for (const folder of folders) expect(folder.seed).toBe(folder.title)
    for (const node of nodes) {
      if (node.type === 'section' || node.type === 'group') {
        expect(isFolder(node, kindViewFixtures)).toBe(thumbnails.some(({ id }) => id === node.id))
      }
    }
  })

  it('makes a thumbnail of text of an item, colored by its kind, with the icon of the kind', () => {
    const nodes = outlineOf('persona_catalog')
    const personas = folderThumbnails(nodes, kindViewFixtures).flatMap((thumbnail) =>
      thumbnail.target.type === 'item' ? [thumbnail] : [],
    )
    const groups = nodes.flatMap((node) => (node.type === 'group' ? [node] : []))
    const items = [
      ...personas,
      ...folderThumbnails(
        groups.flatMap(({ children }) => children),
        kindViewFixtures,
      ),
    ]

    expect(items.length).toBeGreaterThan(0)
    for (const thumbnail of items) {
      expect(thumbnail.look).toBe('text')
      expect(thumbnail.seed).toBe(
        thumbnail.target.type === 'item' ? thumbnail.target.item.kind : '',
      )
    }
    expect(items.every(({ icon }) => icon === 'user')).toBe(true)
  })
})

describe('rootThumbnails', () => {
  it('puts the overview first when the document has fields of its own', () => {
    const thumbnails = rootThumbnails(outlineOf('persona_catalog'), kindViewFixtures, {
      hasFields: true,
    })

    expect(thumbnails[0]).toMatchObject({ id: 'overview', look: 'text', title: overviewTitle })
    expect(thumbnails[0]?.target).toEqual({ type: 'overview' })
  })

  it('has no overview when there is no text of its own and something else to open', () => {
    const nodes = outlineOf('persona_catalog').filter(({ type }) => type !== 'section')
    const thumbnails = rootThumbnails(nodes, kindViewFixtures, { hasFields: false })

    expect(thumbnails.some(({ id }) => id === 'overview')).toBe(false)
  })

  it('is just the overview for a document that has no item', () => {
    expect(rootThumbnails([], kindViewFixtures, { hasFields: true })).toHaveLength(1)
  })
})

describe('outlinePath', () => {
  it('runs from the top of the outline down to the row, itself included', () => {
    const nodes = outlineOf('requirements_analysis')
    const group = nodes.find(isBranch)
    const leaf = group?.children[0]
    if (group === undefined || leaf === undefined) throw new Error('The fixture has no group')

    expect(outlinePath(nodes, group.id).map(({ id }) => id)).toEqual([group.id])
    expect(outlinePath(nodes, leaf.id).map(({ id }) => id)).toEqual([group.id, leaf.id])
  })

  it('is empty for a row that is not there', () => {
    expect(outlinePath(outlineOf('requirements_analysis'), 'no-such-row')).toEqual([])
  })
})
