import type { ContentSchema } from '@/modules/workflow/entities'

/** A schema reduced to the key prefix that the rule reads. */
const schemaWith = (prefix?: string) => ({ 'x-key-prefix': prefix }) as ContentSchema

/** The schema of a kind, the content of a new item, and the prefix of its key. */
export const newKeyPrefixCases = [
  { name: 'a kind with one prefix', schema: schemaWith('REQ'), content: {}, prefix: 'REQ' },
  { name: 'a kind with no prefix', schema: schemaWith(), content: {}, prefix: null },
  {
    name: 'an epic of a kind with two prefixes',
    schema: schemaWith('US for a user story, EP for an epic'),
    content: { item_type: 'epic' },
    prefix: 'EP',
  },
  {
    name: 'a user story of a kind with two prefixes',
    schema: schemaWith('US for a user story, EP for an epic'),
    content: { item_type: 'user_story' },
    prefix: 'US',
  },
  {
    name: 'a kind with two prefixes and no item type',
    schema: schemaWith('US for a user story, EP for an epic'),
    content: {},
    prefix: 'US',
  },
]
