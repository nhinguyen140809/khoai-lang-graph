import type { LinkType } from '../workflow-vocabulary.types'

function linkType(pairs: LinkType['pairs']): LinkType {
  return {
    key: 'test',
    title: 'Test',
    acyclic: false,
    pairs,
    quotes: { source: false, target: false },
  }
}

/** A link type, a source kind and a target kind, and whether the type connects them. */
export const connectCases = [
  {
    name: 'a pair that lists both kinds',
    linkType: linkType([
      { source: ['raw_requirement', 'latent_need'], target: ['interview_message'] },
    ]),
    source: 'latent_need',
    target: 'interview_message',
    expected: true,
  },
  {
    name: 'a source kind that no pair lists',
    linkType: linkType([{ source: ['raw_requirement'], target: ['persona'] }]),
    source: 'persona',
    target: 'persona',
    expected: false,
  },
  {
    name: 'a target kind that the pair of the source does not list',
    linkType: linkType([{ source: ['raw_requirement'], target: ['persona'] }]),
    source: 'raw_requirement',
    target: 'latent_need',
    expected: false,
  },
  {
    name: 'any source kind and any target kind',
    linkType: linkType([{ source: 'any', target: 'any' }]),
    source: 'conflict',
    target: 'persona',
    expected: true,
  },
  {
    name: 'a target of the same kind as the source',
    linkType: linkType([{ source: ['spec_requirement', 'backlog_item'], target: 'same' }]),
    source: 'backlog_item',
    target: 'backlog_item',
    expected: true,
  },
  {
    name: 'a target of another kind than the source when the pair wants the same',
    linkType: linkType([{ source: ['spec_requirement', 'backlog_item'], target: 'same' }]),
    source: 'backlog_item',
    target: 'spec_requirement',
    expected: false,
  },
  {
    name: 'a second pair when the first does not fit',
    linkType: linkType([
      { source: ['analyzed_requirement'], target: ['raw_requirement'] },
      { source: ['spec_requirement'], target: ['analyzed_requirement'] },
    ]),
    source: 'spec_requirement',
    target: 'analyzed_requirement',
    expected: true,
  },
  {
    name: 'a type with no pair',
    linkType: linkType([]),
    source: 'persona',
    target: 'persona',
    expected: false,
  },
]

/** A link type and the kinds its pairs lead to. */
export const targetKindCases = [
  {
    name: 'the targets of every pair, without a repeat',
    linkType: linkType([
      { source: ['a'], target: ['b', 'c'] },
      { source: ['b'], target: ['c', 'd'] },
    ]),
    expected: ['b', 'c', 'd'],
  },
  {
    name: 'pairs that name any kind or the kind of the source, which lead to no kind',
    linkType: linkType([
      { source: 'any', target: 'any' },
      { source: ['a'], target: 'same' },
    ]),
    expected: [],
  },
  { name: 'a type with no pair', linkType: linkType([]), expected: [] },
]

/** A link type and the levels of kinds it connects. */
export const levelCases = [
  {
    name: 'a chain of pairs, from the kind that only starts links down to the kinds that only receive them',
    linkType: linkType([
      { source: ['analyzed'], target: ['raw', 'need'] },
      { source: ['spec'], target: ['analyzed'] },
      { source: ['backlog'], target: ['spec'] },
    ]),
    expected: [['backlog'], ['spec'], ['analyzed'], ['raw', 'need']],
  },
  {
    name: 'one pair',
    linkType: linkType([{ source: ['message_author', 'speaker'], target: ['message'] }]),
    expected: [['message_author', 'speaker'], ['message']],
  },
  {
    name: 'a kind that is in two pairs, placed once',
    linkType: linkType([
      { source: ['a'], target: ['b', 'c'] },
      { source: ['b'], target: ['c'] },
    ]),
    expected: [['a'], ['b', 'c']],
  },
  {
    name: 'a loop, which has no kind that only starts links',
    linkType: linkType([
      { source: ['a'], target: ['b'] },
      { source: ['b'], target: ['a'] },
    ]),
    expected: [],
  },
  {
    name: 'pairs that name any kind or the kind of the source',
    linkType: linkType([
      { source: 'any', target: 'any' },
      { source: ['a'], target: 'same' },
    ]),
    expected: [],
  },
]
