import { z } from 'zod'

import type { InterruptQuestion } from '@/modules/review/entities'
import { questionAnswerSchema } from '@/modules/workflow/entities'
import { isBlank } from '@/shared/lib/guards'

import { answerReviewMessages } from './answer-review.constants'
import type { AnswerProblem } from './answer-review.types'
import { answerProblem } from './answer-review.utils'

/** The words of a problem of an answer, by its type. */
function problemWords(problem: AnswerProblem): string {
  const words = answerReviewMessages.problems[problem.type]
  return words(problem as never)
}

/** The schema of the form that answers a review: the option, the feedback and the answers. */
export function answerReviewFormSchema(interrupt: {
  options: { key: string | null; requires_feedback: boolean }[]
  questions: InterruptQuestion[]
}) {
  return z
    .object({
      option: z
        .string()
        .nullable()
        .refine((option) => option !== null || interrupt.options.length === 0, {
          message: answerReviewMessages.chooseOption,
        }),
      feedback: z.string(),
      answers: z.record(z.string(), questionAnswerSchema),
    })
    .superRefine((values, context) => {
      const chosen = interrupt.options.find(({ key }) => key === values.option)
      if (chosen?.requires_feedback === true && isBlank(values.feedback)) {
        context.addIssue({
          code: 'custom',
          path: ['feedback'],
          message: answerReviewMessages.writeFeedback,
        })
      }
      for (const question of interrupt.questions) {
        const problem = answerProblem(question, values.answers[question.key])
        if (problem !== null) {
          context.addIssue({
            code: 'custom',
            path: ['answers', question.key],
            message: problemWords(problem),
          })
        }
      }
    })
}
