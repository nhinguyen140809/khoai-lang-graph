import type { ComponentProps, SubmitEvent } from 'react'

interface FormProps extends Omit<ComponentProps<'form'>, 'onSubmit'> {
  /** The submit handler that `handleSubmit` of react-hook-form returns. */
  onSubmit: (event: SubmitEvent<HTMLFormElement>) => Promise<void>
}

/**
 * A form of react-hook-form that its schema checks instead of the browser, so that every error
 * shows at its field in the words of the app. A form with nothing to check, such as a prompt, is a
 * plain `<form>`.
 */
export function Form({ onSubmit, ...props }: FormProps) {
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void onSubmit(event)
      }}
      {...props}
    />
  )
}
