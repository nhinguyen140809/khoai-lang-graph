import { describe, expect, it } from 'vitest'

import type { ContentSchema } from '@/modules/workflow/entities'

import { groupItemsBy } from '../item-list.utils'
import type { outlineItemsOf } from '../outline.utils'

describe('groupItemsBy', () => {
  const groupSchema: ContentSchema = { title: 'Kind', 'x-ui-group-by': 'name' }
  const item = (id: string, name: unknown) =>
    ({ id, content: { name } }) as unknown as ReturnType<typeof outlineItemsOf>[number]

  it('groups the items by the text of a field, in the order its values first appear', () => {
    const groups = groupItemsBy(
      [item('1', 'Students'), item('2', 'Staff'), item('3', 'Students')],
      groupSchema,
    )

    expect(groups.map(({ value, items }) => [value, items.map(({ id }) => id)])).toEqual([
      ['Students', ['1', '3']],
      ['Staff', ['2']],
    ])
  })

  it('takes a value that differs only in case or spacing for the one written first', () => {
    const groups = groupItemsBy(
      [item('1', 'Commuter students'), item('2', ' commuter   Students ')],
      groupSchema,
    )

    expect(groups).toHaveLength(1)
    expect(groups[0]?.value).toBe('Commuter students')
  })

  it('gathers the items with no value in a group of their own', () => {
    const groups = groupItemsBy([item('1', null), item('2', ''), item('3', 'Staff')], groupSchema)

    expect(groups.map(({ value }) => value)).toEqual(['', 'Staff'])
  })
})
