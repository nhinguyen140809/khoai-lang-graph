import { describe, expect, it } from 'vitest'

import { folderBlocks, isFolder, overviewTitle, rootBlocks } from '../folder-blocks.utils'
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

describe('folderBlocks', () => {
  it('makes a folder of a section or a group that holds items, colored by its title', () => {
    const nodes = outlineOf('requirements_analysis')
    const blocks = folderBlocks(nodes, kindViewFixtures)
    const folders = blocks.filter(({ look }) => look === 'folder')

    expect(folders.length).toBeGreaterThan(0)
    for (const folder of folders) expect(folder.seed).toBe(folder.title)
    for (const node of nodes) {
      if (node.type === 'section' || node.type === 'group') {
        expect(isFolder(node, kindViewFixtures)).toBe(blocks.some(({ id }) => id === node.id))
      }
    }
  })

  it('makes a block of text of an item, colored by its kind, with the icon of the kind', () => {
    const nodes = outlineOf('persona_catalog')
    const personas = folderBlocks(nodes, kindViewFixtures).flatMap((block) =>
      block.target.type === 'item' ? [block] : [],
    )
    const groups = nodes.flatMap((node) => (node.type === 'group' ? [node] : []))
    const items = [
      ...personas,
      ...folderBlocks(
        groups.flatMap(({ children }) => children),
        kindViewFixtures,
      ),
    ]

    expect(items.length).toBeGreaterThan(0)
    for (const block of items) {
      expect(block.look).toBe('text')
      expect(block.seed).toBe(block.target.type === 'item' ? block.target.item.kind : '')
    }
    expect(items.every(({ icon }) => icon === 'user')).toBe(true)
  })
})

describe('rootBlocks', () => {
  it('puts the overview first when the document has fields of its own', () => {
    const blocks = rootBlocks(outlineOf('persona_catalog'), kindViewFixtures, {
      hasFields: true,
    })

    expect(blocks[0]).toMatchObject({ id: 'overview', look: 'text', title: overviewTitle })
    expect(blocks[0]?.target).toEqual({ type: 'overview' })
  })

  it('has no overview when there is no text of its own and something else to open', () => {
    const nodes = outlineOf('persona_catalog').filter(({ type }) => type !== 'section')
    const blocks = rootBlocks(nodes, kindViewFixtures, { hasFields: false })

    expect(blocks.some(({ id }) => id === 'overview')).toBe(false)
  })

  it('is just the overview for a document that has no item', () => {
    expect(rootBlocks([], kindViewFixtures, { hasFields: true })).toHaveLength(1)
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
