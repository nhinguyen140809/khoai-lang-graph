import { reviewNodes, reviewsInOrder } from '../../shared/reviews.constants'

export const idea = 'A web app where students book study rooms'

const [, analysis] = reviewsInOrder

/** What the scripted agent asks about the interviewees, in a step of its own before the review. */
export const personasAsk = {
  node: 'ask_personas',
  prompt:
    'A few questions about the interviewees, so that the interviews focus on what matters to you. Answer what you can; any of them may be left blank.',
  question: {
    key: 'focus',
    prompt: 'Whom should the interviews focus on?',
    choices: ['students', 'mentors', 'other'],
    defaultChoice: 'students',
  },
}

/** What the scripted agent before the analysis review suggests for an option that asks for feedback. */
export const analysisReview = {
  node: reviewNodes.analysis,
  prompt: analysis.prompt,
  option: 'Redo the analysis',
  optionKey: 'reject_reanalyse',
  suggestion: 'Settle the open questions in favour of the students.',
  otherOption: 'Interview again',
  /** What the scripted agent says choosing each option does. */
  descriptions: {
    accept: 'The analysis goes on to the specification.',
    reject_reanalyse: 'The analysis is written again, settling the open questions.',
  },
  /** The option that none of the others say, and what the user writes for it. */
  somethingElse: {
    key: 'other',
    label: 'Something else',
    words: 'Also cover cancelling a booking.',
  },
}
