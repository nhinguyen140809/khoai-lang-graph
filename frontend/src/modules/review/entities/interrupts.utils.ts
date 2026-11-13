import type { CheckpointOption, QuestionAnswer } from '@/modules/workflow/entities/@x/review'

import type { AnswerLine, Interrupt } from './interrupts.types'

/** The option that answered a review; null while it waits, without options, or once cancelled. */
export function decisionOption(
  interrupt: Pick<Interrupt, 'options' | 'decision'>,
): CheckpointOption | null {
  const option = interrupt.decision?.option
  const chosen = option === null ? undefined : interrupt.options.find(({ key }) => key === option)
  return chosen ?? null
}

/** The words of an answer: the labels of the choices, then the text or the number, if any. */
function answerText(question: Interrupt['questions'][number], answer: QuestionAnswer): string {
  const labels = answer.choice_keys.map(
    (key) => question.choices.find((choice) => choice.key === key)?.label ?? key,
  )
  const typed = answer.text?.trim() ?? ''
  return [...labels, typed, answer.number === null ? '' : String(answer.number)]
    .filter((part) => part !== '')
    .join(', ')
}

/**
 * The questions of a resolved interrupt that have an answer, in the order they were asked; a
 * question left blank, and an answer to a question the interrupt does not hold, are left out.
 */
export function answerLines(interrupt: Pick<Interrupt, 'questions' | 'decision'>): AnswerLine[] {
  const answers = interrupt.decision?.answers ?? {}
  return interrupt.questions.flatMap((question) => {
    const answer = answers[question.key]
    const text = answer === undefined ? '' : answerText(question, answer)
    return text === '' ? [] : [{ prompt: question.prompt, text }]
  })
}
