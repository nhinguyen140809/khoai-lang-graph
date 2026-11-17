import { LayoutChoice } from '@/modules/user/features/view'

import { viewChoiceMessages } from './view-choice.constants'

/**
 * The page that asks, once, which view of the app to use: a question and the choice of the layout.
 * Choosing a card saves the choice in the settings of the user and opens the start page of that
 * view, on the host that shows it.
 */
export function ViewChoicePage() {
  return (
    <div className="flex w-full max-w-4xl flex-col items-center gap-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">{viewChoiceMessages.question}</h1>
        <p className="text-sm text-muted-foreground">{viewChoiceMessages.hint}</p>
      </div>
      <LayoutChoice />
    </div>
  )
}
