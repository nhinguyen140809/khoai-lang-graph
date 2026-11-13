import { reviewNodes } from '../../shared/reviews.constants'

export const idea = 'A web app where students book study rooms'

/** An answer that the API refuses, the review it answers, and the field it names. */
export const refusedAnswers: {
  name: string
  node: string
  answer: { option?: string; feedback?: string }
  field: string
}[] = [
  {
    name: 'an option the review does not have',
    node: reviewNodes.analysis,
    answer: { option: 'burn_it_down' },
    field: 'option',
  },
  {
    name: 'no option when the review has options',
    node: reviewNodes.analysis,
    answer: {},
    field: 'option',
  },
  {
    name: 'a rejection without feedback',
    node: reviewNodes.analysis,
    answer: { option: 'reject_reanalyse' },
    field: 'feedback',
  },
  {
    name: 'a rejection of the specification with blank feedback',
    node: reviewNodes.specification,
    answer: { option: 'not_ok', feedback: '   ' },
    field: 'feedback',
  },
]
