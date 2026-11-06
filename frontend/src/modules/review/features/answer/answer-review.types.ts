import type { QuestionAnswer } from '@/modules/workflow/entities'

/** What is wrong with an answer to a question of a review, with the count or the label its words name. */
export type AnswerProblem =
  | { type: 'chooseOne' }
  | { type: 'chooseAtLeast'; count: number }
  | { type: 'chooseAtMost'; count: number }
  | { type: 'writeAnswer' }
  | { type: 'enterNumber' }
  | { type: 'explainChoice'; label: string }

/** The values of the form that answers a review. */
export interface AnswerReviewFormValues {
  option: string | null
  feedback: string
  answers: Record<string, QuestionAnswer>
}
