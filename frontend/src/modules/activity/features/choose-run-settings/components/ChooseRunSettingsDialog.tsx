'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'

import {
  isRunDefaultsEmpty,
  noRunDefaultsFieldValues,
  RunDefaultsFields,
  runDefaultsFieldsSchema,
  type RunDefaultsFieldValues,
  runDefaultsFieldValuesOf,
  toRunDefaults,
  useRunSettingsOptions,
} from '@/modules/run/entities'
import { Form } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { ScrollArea } from '@/shared/components/ui/scroll-area'

import { chooseRunSettingsMessages } from '../choose-run-settings.constants'
import { useChosenRunSettings, useChosenRunSettingsStore } from '../hooks/useChosenRunSettings'
import { useRunSettingsDialog } from '../hooks/useOpenRunSettingsDialog'

/** The dialog of the settings of the next run of a thread, mounted once by the activity. */
export function ChooseRunSettingsDialog() {
  const { targetId: threadId, open, setOpen, closed } = useRunSettingsDialog()
  const { checkpoints, parameterFields } = useRunSettingsOptions()
  const chosen = useChosenRunSettings(threadId)
  const { chooseSettings, clearSettings } = useChosenRunSettingsStore()
  const schema = useMemo(() => runDefaultsFieldsSchema(parameterFields), [parameterFields])

  const form = useForm<RunDefaultsFieldValues>({
    resolver: zodResolver(schema),
    defaultValues:
      chosen === undefined
        ? noRunDefaultsFieldValues
        : runDefaultsFieldValuesOf(chosen, parameterFields),
  })

  // The dialog stays mounted: its values follow the thread it opens for, and Cancel drops the edits.
  useEffect(() => {
    if (!open) return
    form.reset(
      chosen === undefined
        ? noRunDefaultsFieldValues
        : runDefaultsFieldValuesOf(chosen, parameterFields),
    )
  }, [open, threadId, chosen, parameterFields, form])

  const apply = form.handleSubmit((values) => {
    if (threadId === null) return
    const settings = toRunDefaults(values, parameterFields)
    // An empty choice clears the settings: the project values then apply.
    if (isRunDefaultsEmpty(settings)) clearSettings(threadId)
    else chooseSettings(threadId, settings)
    setOpen(false)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent size="xl" scrollBody onCloseAutoFocus={closed}>
        <DialogHeader>
          <DialogTitle>{chooseRunSettingsMessages.title}</DialogTitle>
          <DialogDescription>{chooseRunSettingsMessages.description}</DialogDescription>
        </DialogHeader>
        <Form
          onSubmit={async (event) => {
            event.preventDefault()
            await apply()
          }}
          className="grid min-h-0 grid-rows-body-footer gap-4"
        >
          <ScrollArea className="-mr-3 -ml-1 min-h-0">
            <div className="py-1 pr-3 pl-1">
              <RunDefaultsFields
                control={form.control}
                legend={chooseRunSettingsMessages.legend}
                checkpoints={checkpoints}
                parameterFields={parameterFields}
                showNote={false}
              />
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                form.reset(noRunDefaultsFieldValues)
              }}
            >
              {chooseRunSettingsMessages.reset}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false)
              }}
            >
              {chooseRunSettingsMessages.cancel}
            </Button>
            <Button type="submit">{chooseRunSettingsMessages.apply}</Button>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
