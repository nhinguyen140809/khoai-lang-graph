'use client'

import type { ArtifactItem } from '@/modules/artifact/entities'
import { linkSentence } from '@/modules/trace/entities'
import { useItemTitleOf, useLinkTitleOf } from '@/modules/workflow/entities'
import { Form } from '@/shared/components/form'
import { Button } from '@/shared/components/ui/button'
import { DialogClose, DialogFooter } from '@/shared/components/ui/dialog'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/shared/components/ui/field'
import { Item, ItemContent } from '@/shared/components/ui/item'
import { PendingButton } from '@/shared/components/ui/pending-button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Textarea } from '@/shared/components/ui/textarea'

import { addLinkMessages, linkNote } from '../add-link.constants'
import { useAddLinkForm } from '../hooks/useAddLinkForm'
import { LinkTargetField } from './LinkTargetField'

interface AddLinkFormProps {
  projectId: string
  source: ArtifactItem
  onAdded: () => void
}

/** The form of the Add link dialog: the kind of link, the other item, and the note. */
export function AddLinkForm({ projectId, source, onAdded }: AddLinkFormProps) {
  const titleOf = useItemTitleOf()
  const linkTitleOf = useLinkTitleOf()
  const {
    form,
    add,
    choices,
    linkType,
    note,
    chosen,
    targets,
    isSearchStarted,
    submit,
    searchTargets,
    chooseTarget,
    chooseLinkType,
  } = useAddLinkForm(projectId, source, onAdded)

  return (
    <Form onSubmit={submit} className="flex flex-col gap-6">
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="add-link-type">{addLinkMessages.linkType}</FieldLabel>
          <Select value={linkType} onValueChange={chooseLinkType}>
            <SelectTrigger id="add-link-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {choices.map(({ key, title }) => (
                <SelectItem key={key} value={key}>
                  {title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>{form.formState.errors.link_type?.message}</FieldError>
        </Field>

        <LinkTargetField
          targets={targets}
          chosen={chosen}
          isSearchStarted={isSearchStarted}
          error={form.formState.errors.target_item_id?.message}
          onChoose={chooseTarget}
          onSearch={searchTargets}
        />

        {chosen !== null && linkType !== '' && (
          <Item variant="muted" size="xs">
            <ItemContent>
              {linkSentence(
                titleOf(source),
                { key: linkType, title: linkTitleOf(linkType) },
                titleOf(chosen),
                { tense: 'will' },
              )}
            </ItemContent>
          </Item>
        )}

        <Field>
          <FieldLabel htmlFor="add-link-note">{addLinkMessages.note}</FieldLabel>
          <Textarea id="add-link-note" {...form.register('note')} />
          <FieldDescription>{addLinkMessages.noteHint}</FieldDescription>
          <FieldError>{form.formState.errors.note?.message}</FieldError>
          {note.length >= linkNote.counterFrom && (
            <p className="text-xs text-muted-foreground">
              {String(note.length)} / {String(linkNote.maxLength)}
            </p>
          )}
        </Field>

        <FieldError>{add.formError}</FieldError>
      </FieldGroup>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">
            {addLinkMessages.cancel}
          </Button>
        </DialogClose>
        <PendingButton type="submit" pending={add.isPending} pendingLabel={addLinkMessages.adding}>
          {addLinkMessages.add}
        </PendingButton>
      </DialogFooter>
    </Form>
  )
}
