'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'

import type { ArtifactItem } from '@/modules/artifact/entities'
import { useLinkTargets } from '@/modules/trace/entities'
import { linkTypesFrom, useWorkflowDefinition } from '@/modules/workflow/entities'
import { useDebouncedValue } from '@/shared/lib/scheduling'

import { targetSearchDebounceMs } from '../add-link.constants'
import { addLinkFormSchema, type AddLinkFormValues } from '../add-link.schema'
import { useAddLink } from './useAddLink'

/**
 * What the form of the Add link dialog holds: the kinds of link that the source may start, the
 * form with the kind chosen, the other item found by search and the note, and the request that
 * adds the link. The search waits for the last key, so that each word is not a request of its own,
 * and starts with the first key: opening the dialog alone reads nothing.
 */
export function useAddLinkForm(projectId: string, source: ArtifactItem, onAdded: () => void) {
  const { data: definition } = useWorkflowDefinition()
  const choices = useMemo(
    () => (definition === undefined ? [] : linkTypesFrom(definition, source.kind)),
    [definition, source.kind],
  )

  const form = useForm<AddLinkFormValues>({
    resolver: zodResolver(addLinkFormSchema),
    defaultValues: { link_type: choices[0]?.key ?? '', target_item_id: '', note: '' },
  })
  const add = useAddLink(projectId, source.id, form.setError, onAdded)

  // The kinds of link are known once the definition has loaded; the first is chosen.
  useEffect(() => {
    if (choices.length > 0 && form.getValues('link_type') === '') {
      form.setValue('link_type', choices[0]?.key ?? '')
    }
  }, [choices, form])

  const [chosen, setChosen] = useState<ArtifactItem | null>(null)
  const [typedText, setTypedText] = useState('')
  const searchText = useDebouncedValue(typedText, targetSearchDebounceMs)

  const linkType = useWatch({ control: form.control, name: 'link_type' })
  const note = useWatch({ control: form.control, name: 'note' })
  const choice = choices.find(({ key }) => key === linkType)
  const targetKinds = useMemo(() => choice?.targetKinds ?? [], [choice])

  const isSearchStarted = searchText.trim() !== ''
  const targets = useLinkTargets(projectId, {
    kinds: targetKinds,
    text: searchText,
    excludeId: source.id,
    isEnabled: isSearchStarted,
  })

  return {
    form,
    add,
    choices,
    linkType,
    note,
    chosen,
    targets: targets.items,
    isSearchStarted,
    submit: form.handleSubmit((values) => {
      add.mutate(values)
    }),
    searchTargets: setTypedText,
    chooseTarget: (item: ArtifactItem | null) => {
      setChosen(item)
      form.setValue('target_item_id', item === null ? '' : item.id, { shouldValidate: true })
    },
    chooseLinkType: (value: string) => {
      form.setValue('link_type', value, { shouldValidate: true })
      // Another kind of link leads to other kinds of item: the chosen item leaves.
      const kinds = choices.find(({ key }) => key === value)?.targetKinds ?? []
      if (chosen !== null && kinds.length > 0 && !kinds.includes(chosen.kind)) {
        setChosen(null)
        form.setValue('target_item_id', '')
      }
    },
  }
}
