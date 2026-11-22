import type { ReactNode } from 'react'

import { type ExportFormat, exportFormatLabels } from '@/modules/workflow/entities'
import { Reveal } from '@/shared/components/animation'
import { Checkbox } from '@/shared/components/ui/checkbox'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/shared/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'

import { exportMessages } from '../export.constants'

/** The time before the cards start to come in, so that the dialog has opened first, in milliseconds. */
const cardsRevealDelayMs = 80

interface ExportChoiceProps {
  id: string
  /** The icon before the title, for a card that is not one of the documents. */
  icon?: ReactNode
  title: string
  /** What the choice holds, in a line under the title. */
  description: string
  /** The file types that the choice offers, and the one chosen; the select stands off until the choice is made. */
  formats: readonly ExportFormat[]
  format: ExportFormat | undefined
  isChecked: boolean
  isDisabled: boolean
  /** The place of the card among the cards, so that they come in one after another. */
  index: number
  onCheckedChange: (isChecked: boolean) => void
  onFormatChange: (format: ExportFormat) => void
}

/**
 * A choice of the dialog as a card: its title and what it holds, the select of its file type, and the
 * checkbox at its end. The select is always there and is turned off until the card is chosen, so
 * that choosing a card never moves the others.
 */
export function ExportChoice({
  id,
  icon,
  title,
  description,
  formats,
  format,
  isChecked,
  isDisabled,
  index,
  onCheckedChange,
  onFormatChange,
}: ExportChoiceProps) {
  return (
    <Reveal asChild index={index} delay={cardsRevealDelayMs}>
      <FieldLabel htmlFor={id}>
        <Field orientation="horizontal" data-disabled={isDisabled}>
          {icon}
          <FieldContent>
            <FieldTitle id={`${id}-title`}>{title}</FieldTitle>
            <FieldDescription id={`${id}-contents`}>{description}</FieldDescription>
          </FieldContent>
          <Select
            {...(format !== undefined && { value: format })}
            disabled={isDisabled || !isChecked}
            onValueChange={(next) => {
              const offered = formats.find((candidate) => candidate === next)
              if (offered !== undefined) onFormatChange(offered)
            }}
          >
            <SelectTrigger size="sm" aria-label={exportMessages.fileTypeOf(title)}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {formats.map((offered) => (
                <SelectItem key={offered} value={offered}>
                  {exportFormatLabels[offered]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Checkbox
            id={id}
            checked={isChecked}
            disabled={isDisabled}
            aria-labelledby={`${id}-title`}
            aria-describedby={`${id}-contents`}
            onCheckedChange={(next) => {
              onCheckedChange(next === true)
            }}
          />
        </Field>
      </FieldLabel>
    </Reveal>
  )
}
