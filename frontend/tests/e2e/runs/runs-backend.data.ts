import { reviewsInOrder } from '../../shared/reviews.constants'

export const idea = 'A mobile app that lets neighbours share tools'

const [personas, analysis, specification] = reviewsInOrder

/**
 * A project started from an idea, which stops at every question and review: what each stop shows,
 * and the option that answers it (none for questions, which are sent as they are). The scripted
 * agents word the first two reviews and ask about the interviewees, and the scripted validator
 * turns the first specification back, so the specification is reviewed twice.
 */
export const reviewStops: { status: string; prompt: string; approve: string | null }[] = [
  {
    status: personas.status,
    prompt:
      'A few questions about the interviewees, so that the interviews focus on what matters to you. Answer what you can; any of them may be left blank.',
    approve: null,
  },
  {
    status: personas.status,
    prompt: 'I proposed the interviewees. Check that they cover the people who matter.',
    approve: personas.approve,
  },
  {
    status: analysis.status,
    prompt:
      'I wrote the requirements analysis and found open questions. Check them, then approve it.',
    approve: analysis.approve,
  },
  { status: specification.status, prompt: specification.prompt, approve: specification.approve },
  { status: specification.status, prompt: specification.prompt, approve: specification.approve },
]

export const laterIdea = 'Also let neighbours rate each other.'
