import type { Page } from '@playwright/test'

import { pressAlertDialogButton, pressDialogButton } from './dialog.utils'
import {
  expectAlert,
  expectFieldErrors,
  expectFieldValue,
  expectLabel,
  expectNoRole,
  expectRole,
  expectText,
  expectUrl,
} from './expectations.utils'
import {
  fillFields,
  fillTextbox,
  pressButton,
  pressLink,
  pressMenuItem,
  submitForm,
} from './form.utils'
import { pressKey, typeText } from './keyboard.utils'
import {
  answerReviewWith,
  chooseReviewOption,
  discardItemEdit,
  expectReviewPrompt,
  expectRunStatus,
  fillItemField,
  fillReviewFeedback,
  openActivity,
  openItem,
  openSidePanel,
  openTreeItem,
  saveItem,
  sendAnswers,
  sendChatMessage,
  sendReview,
  startEditingItem,
  startProject,
  stopRun,
} from './run-steps.utils'

const steps = {
  answerReviewWith,
  discardItemEdit,
  chooseReviewOption,
  expectAlert,
  expectFieldErrors,
  expectFieldValue,
  expectLabel,
  expectNoRole,
  expectReviewPrompt,
  expectRole,
  expectRunStatus,
  expectText,
  expectUrl,
  fillFields,
  fillItemField,
  fillReviewFeedback,
  fillTextbox,
  openActivity,
  openItem,
  openSidePanel,
  openTreeItem,
  pressAlertDialogButton,
  pressButton,
  pressDialogButton,
  pressKey,
  pressLink,
  pressMenuItem,
  saveItem,
  sendChatMessage,
  sendAnswers,
  sendReview,
  startEditingItem,
  startProject,
  stopRun,
  submitForm,
  typeText,
}

type Bound<Step> = Step extends (page: Page, ...args: infer Args) => infer Result
  ? (...args: Args) => Result
  : never

/** The steps of this folder as the user of a page performs them: each one is called without the page. */
export type UserSteps = { [Name in keyof typeof steps]: Bound<(typeof steps)[Name]> }

/** Binds each step to the page, so that a test writes `user.pressButton('Log in')`. */
export function userOf(page: Page): UserSteps {
  const bound: Record<string, unknown> = {}
  for (const [name, step] of Object.entries(steps)) {
    bound[name] = (...args: unknown[]) => (step as (...all: unknown[]) => unknown)(page, ...args)
  }
  return bound as UserSteps
}
