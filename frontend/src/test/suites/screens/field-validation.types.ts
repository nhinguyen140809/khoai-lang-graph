/** The fields typed in a form, by label, and the messages it shows before it sends anything. */
export interface MissingFieldCase {
  name: string
  typed: Readonly<Record<string, string>>
  messages: readonly string[]
}

/** A form that refuses fields, as `itAsksForFieldsBeforeSending` needs to know it. */
export interface FieldValidationSuite {
  /** Renders the form. */
  renderForm: () => void
  /** The words of the button that sends the form. */
  submitLabel: string
  cases: readonly MissingFieldCase[]
}
