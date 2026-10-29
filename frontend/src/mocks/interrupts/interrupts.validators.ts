import type {
  Interrupt,
  InterruptQuestion,
  ModifiedItem,
  ResumeRunBody,
} from '@/modules/review/entities'
import type { QuestionAnswer } from '@/modules/workflow/entities'
import type { FieldProblem } from '@/shared/api/error'
import { hasText, isRecord, isString } from '@/shared/lib/guards'

import { findItem } from '../artifacts/artifacts.lookup'
import {
  choice,
  choiceProblem,
  jsonObject,
  jsonObjectProblem,
  optionalText,
  optionalTextProblem,
  positiveInteger,
  positiveIntegerProblem,
  requiredText,
  requiredTextProblem,
} from '../shared/http/validation'

// What the body of the request that answers a pending interrupt may hold: the option, the feedback,
// the answers to the questions and the items the user edited. The checks are written from the rules
// of the API, apart from the rules of the app, so that the mock does not repeat a mistake of the app.

// The keys that an answer picks, or undefined when the field is not a list of keys.
function choiceKeysOf(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(isString) ? value : undefined
}

// The number of an answer, or undefined when the field is neither a number nor null.
function optionalNumber(value: unknown): number | null | undefined {
  if (value == null) return null
  return typeof value === 'number' ? value : undefined
}

/** The answer as the body gives it, once its shape has no problem. */
function answerOf(given: Record<string, unknown>): QuestionAnswer {
  return {
    choice_keys: choiceKeysOf(given.choice_keys) ?? [],
    text: optionalText(given.text) ?? null,
    number: optionalNumber(given.number) ?? null,
  }
}

/**
 * The problems of the answer to one question, by the rules of its type: the choices an answer picks,
 * the text that the question or a chosen choice asks for, and the number of a number question.
 */
export function answerProblems(
  question: InterruptQuestion,
  answer: unknown,
  field: string,
): FieldProblem[] {
  if (!isRecord(answer)) return [jsonObjectProblem(field)]
  const problems: FieldProblem[] = []
  const keys = choiceKeysOf(answer.choice_keys)
  const text = optionalText(answer.text)
  const number = optionalNumber(answer.number)
  if (keys === undefined) problems.push({ field, message: 'Send the chosen choices as keys.' })
  if (text === undefined) problems.push(optionalTextProblem(field))
  if (number === undefined) problems.push({ field, message: 'Send a number, or nothing.' })
  if (keys === undefined || text === undefined || number === undefined) return problems

  const choiceKeys = question.choices.map(({ key }) => key)
  const chosen = keys.filter((key) => choiceKeys.includes(key))
  const hasUnknownKey = chosen.length !== keys.length
  const tooFewChoices = (fewest: number) => ({
    field,
    message:
      fewest === 1 ? 'Choose at least one choice.' : `Choose at least ${String(fewest)} choices.`,
  })
  switch (question.type) {
    case 'single_select':
      if (hasUnknownKey || chosen.length !== 1) {
        problems.push({ field, message: 'Choose one of the choices.' })
      }
      break
    case 'multi_select': {
      if (hasUnknownKey) problems.push({ field, message: 'Choose the choices of the question.' })
      const fewest = Math.max(question.min_selected ?? 0, question.required ? 1 : 0)
      if (chosen.length < fewest) problems.push(tooFewChoices(fewest))
      if (question.max_selected !== null && chosen.length > question.max_selected) {
        problems.push({
          field,
          message: `Choose at most ${String(question.max_selected)} choices.`,
        })
      }
      break
    }
    case 'free_text':
      if (question.required && !hasText(text)) problems.push(requiredTextProblem(field))
      break
    case 'number':
      if (question.required && number === null) {
        problems.push({ field, message: 'Enter a number.' })
      }
      break
  }
  const hasChoiceThatRequiresText = question.choices.some(
    ({ key, requires_text }) => requires_text && chosen.includes(key),
  )
  if (hasChoiceThatRequiresText && !hasText(text)) problems.push(requiredTextProblem(field))
  return problems
}

// The option that the body chooses: one of the options of the interrupt, or null for an interrupt
// without options. Undefined when the body chooses none of them, or one where there are none.
function chosenOption(interrupt: Interrupt, given: unknown): string | null | undefined {
  const keys = interrupt.options.map(({ key }) => key)
  if (keys.length === 0) return given == null ? null : undefined
  return choice(keys, given)
}

// The items the user edited before answering, with the problems of the entries that name none.
function modifiedItemsOf(
  interrupt: Interrupt,
  given: unknown,
): { items: ModifiedItem[]; problems: FieldProblem[] } {
  if (given === undefined) return { items: [], problems: [] }
  if (!Array.isArray(given)) {
    return { items: [], problems: [{ field: 'modified_items', message: 'Send a list.' }] }
  }
  if (given.length > 0 && !interrupt.allow_edits) {
    return {
      items: [],
      problems: [{ field: 'modified_items', message: 'This review does not accept edits.' }],
    }
  }
  const items: ModifiedItem[] = []
  const problems: FieldProblem[] = []
  given.forEach((entry, index) => {
    const field = `modified_items.${String(index)}`
    if (!isRecord(entry)) {
      problems.push(jsonObjectProblem(field))
      return
    }
    if (!isString(entry.item_id)) {
      problems.push({ field, message: 'Send the id of an item.' })
      return
    }
    if (findItem(entry.item_id) === undefined) {
      problems.push({ field, message: 'This item does not exist.' })
      return
    }
    const version = positiveInteger(entry.version)
    if (version === undefined) {
      problems.push(positiveIntegerProblem(field))
      return
    }
    items.push({ item_id: entry.item_id, version })
  })
  return { items, problems }
}

/**
 * The body of the request that answers the pending interrupt: the decision that it describes, or
 * the problems of its fields. The interrupt is the one the run waits for.
 */
export function validateResumeBody(
  interrupt: Interrupt,
  given: Record<string, unknown>,
): { decision: ResumeRunBody } | { problems: FieldProblem[] } {
  const problems: FieldProblem[] = []

  const option = chosenOption(interrupt, given.option)
  if (option === undefined) problems.push(choiceProblem('option'))

  const isFeedbackRequired =
    interrupt.options.find(({ key }) => key === option)?.requires_feedback ?? false
  const feedback = isFeedbackRequired ? requiredText(given.feedback) : optionalText(given.feedback)
  if (feedback === undefined) {
    problems.push(
      isFeedbackRequired ? requiredTextProblem('feedback') : optionalTextProblem('feedback'),
    )
  }

  const answers = given.answers === undefined ? {} : jsonObject(given.answers)
  const answered: Record<string, QuestionAnswer> = {}
  if (answers === undefined) {
    problems.push(jsonObjectProblem('answers'))
  } else {
    for (const question of interrupt.questions) {
      const field = `answers.${question.key}`
      const answer = answers[question.key]
      if (answer === undefined) {
        if (question.required) problems.push({ field, message: 'Answer this question.' })
        continue
      }
      problems.push(...answerProblems(question, answer, field))
      if (isRecord(answer)) answered[question.key] = answerOf(answer)
    }
    for (const key of Object.keys(answers)) {
      if (interrupt.questions.every(({ key: questionKey }) => questionKey !== key)) {
        problems.push({ field: `answers.${key}`, message: 'Answer a question of this review.' })
      }
    }
  }

  const modified = modifiedItemsOf(interrupt, given.modified_items)
  problems.push(...modified.problems)
  if (problems.length > 0) return { problems }
  return {
    decision: {
      interrupt_id: interrupt.id,
      // The option and the feedback were checked above: no problem means each is set, not missing.
      option: option ?? null,
      feedback: feedback ?? null,
      answers: answered,
      modified_items: modified.items,
    },
  }
}
