import { reviewNodes, reviewsInOrder } from '../../shared/reviews.constants'

export const idea = 'A web app where students book study rooms'

const [personas, analysis] = reviewsInOrder

/** What the scripted agent before the personas review asks, as the review words it. */
export const personasReview = {
  node: reviewNodes.personas,
  prompt: personas.prompt,
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
}
